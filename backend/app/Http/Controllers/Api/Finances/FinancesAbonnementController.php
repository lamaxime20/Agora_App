<?php

namespace App\Http\Controllers\Api\Finances;

use App\Services\ExportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancesAbonnementController extends FinancesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 20 — GET /api/finances/abonnements
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des abonnements de l'entreprise.
     *
     * Query params : page, per_page, statut (tous|actif|résilié), date_debut, date_fin
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $statut    = $request->query('statut', 'actif');
            $dateDebut = $request->query('date_debut');
            $dateFin   = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('frais_mensuel')
                ->where('entreprise', $entrepriseId)
                ->where('actif', true);

            if ($statut === 'actif') {
                $query->where('depense_active', true);
            } elseif ($statut === 'resilié') {
                $query->where('depense_active', false);
            }

            if ($from) {
                $query->where('date_abonnement', '>=', $from->toDateString());
            }
            if ($to) {
                $query->where('date_abonnement', '<=', $to->toDateString());
            }

            $total = $query->count();

            $data = $query
                ->orderBy('date_abonnement', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'id', 'service_paye', 'fournisseur',
                    'montant_mensuel', 'date_abonnement', 'depense_active',
                ])
                ->get()
                ->map(fn($row) => [
                    'id'               => $row->id,
                    'service_paye'     => $row->service_paye,
                    'fournisseur'      => $row->fournisseur,
                    'montant_mensuel'  => (float) $row->montant_mensuel,
                    'date_abonnement'  => $row->date_abonnement,
                    'depense_active'   => (bool) $row->depense_active,
                ]);

            return response()->json([
                'data' => $data,
                'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total],
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 21 — GET /api/finances/abonnements/{id}
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Détail d'un abonnement avec l'historique de ses paiements.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $abonnement = DB::table('frais_mensuel')
                ->where('id', $id)
                ->where('entreprise', $entrepriseId)
                ->first();

            if (!$abonnement) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Abonnement introuvable.',
                ], 404);
            }

            $paiements = DB::table('paiements_abonnements as pa')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'pa.user_enregistre')
                ->where('pa.abonnement', $id)
                ->orderBy('pa.date_paiement', 'desc')
                ->select([
                    'pa.id',
                    'pa.montant',
                    'pa.date_paiement',
                    'pa.reference_transaction',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'                    => $row->id,
                    'montant'               => (float) $row->montant,
                    'date_paiement'         => substr($row->date_paiement, 0, 10),
                    'reference_transaction' => $row->reference_transaction,
                    'enregistre_par'        => $row->enregistre_par,
                ]);

            return response()->json([
                'abonnement' => [
                    'id'               => $abonnement->id,
                    'service_paye'     => $abonnement->service_paye,
                    'fournisseur'      => $abonnement->fournisseur,
                    'montant_mensuel'  => (float) $abonnement->montant_mensuel,
                    'date_abonnement'  => $abonnement->date_abonnement,
                    'depense_active'   => (bool) $abonnement->depense_active,
                ],
                'paiements' => $paiements,
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['abonnement_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 22 — POST /api/finances/abonnements
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Crée un nouvel abonnement.
     *
     * Body JSON : service_paye, fournisseur (optionnel), montant_mensuel, date_abonnement
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'service_paye'    => 'required|string|max:255',
                'fournisseur'     => 'nullable|string|max:255',
                'montant_mensuel' => 'required|numeric|min:0.01',
                'date_abonnement' => 'required|date',
            ], [
                'service_paye.required'    => 'Le nom du service est requis.',
                'montant_mensuel.required' => 'Le montant mensuel est requis.',
                'montant_mensuel.min'      => 'Le montant doit être supérieur à 0.',
                'date_abonnement.required' => "La date de début d'abonnement est requise.",
                'date_abonnement.date'     => "La date d'abonnement est invalide.",
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

            $entreprise   = $this->currentEntreprise($request);
            $user         = $this->currentUser($request);
            $entrepriseId = $entreprise->id;

            $abonnementId = (string) Str::uuid();

            DB::table('frais_mensuel')->insert([
                'id'               => $abonnementId,
                'service_paye'     => $request->input('service_paye'),
                'fournisseur'      => $request->input('fournisseur'),
                'montant_mensuel'  => (float) $request->input('montant_mensuel'),
                'date_abonnement'  => $request->input('date_abonnement'),
                'depense_active'   => true,
                'entreprise'       => $entrepriseId,
                'actif'            => true,
            ]);

            $this->history(
                'finances', 'frais_mensuel', $abonnementId,
                'abonnement créé',
                $request, $user->id, $entrepriseId
            );

            // NOTIFICATIONS — À implémenter ultérieurement
            //
            // Objectif : notifier le directeur de l'entreprise de la création de cet abonnement.
            //
            // 1. Récupérer l'id du directeur de l'entreprise :
            //    $directeurId = DB::table('entreprises')
            //        ->where('id', $entrepriseId)
            //        ->value('directeur');
            //
            // 2. Récupérer le rôle du directeur (pour renseigner le champ role dans notifications) :
            //    $roleDirecteur = DB::table('roles_utilisateur')
            //        ->where('role', 'directeur')  // adapter selon le libellé réel
            //        ->first();
            //
            // 3. Insérer la notification pour le directeur :
            //    DB::table('notifications')->insert([
            //        'id'                => (string) Str::uuid(),
            //        'titre'             => 'Nouvel abonnement enregistré',
            //        'message'           => "Abonnement {$servicePaye} — {$montantMensuel} / mois — Fournisseur : {$fournisseur}",
            //        'type_notification' => 'paiement',
            //        'statut'            => 'non_lue',
            //        'actif'             => true,
            //        'date_arrivee'      => now(),
            //        'utilisateur'       => $directeurId,
            //        'entreprise'        => $entrepriseId,
            //        'role'              => $roleDirecteur->id,
            //    ]);

            return response()->json([
                'abonnement' => [
                    'id'              => $abonnementId,
                    'service_paye'    => $request->input('service_paye'),
                    'fournisseur'     => $request->input('fournisseur'),
                    'montant_mensuel' => (float) $request->input('montant_mensuel'),
                    'date_abonnement' => $request->input('date_abonnement'),
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 23 — POST /api/finances/abonnements/{id}/resilier
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Résilie un abonnement actif.
     *
     * Body JSON : couper_mois_courant (boolean, requis)
     */
    public function resilier(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'couper_mois_courant' => 'required|boolean',
            ], [
                'couper_mois_courant.required' => 'Ce champ est requis.',
                'couper_mois_courant.boolean'  => 'Ce champ doit être un booléen.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

            $entreprise   = $this->currentEntreprise($request);
            $user         = $this->currentUser($request);
            $entrepriseId = $entreprise->id;

            $abonnement = DB::table('frais_mensuel')
                ->where('id', $id)
                ->where('entreprise', $entrepriseId)
                ->first();

            if (!$abonnement) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Abonnement introuvable.',
                ], 404);
            }

            if (!$abonnement->depense_active) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'ALREADY_RESILIATED',
                    'message' => 'Cet abonnement est déjà résilié.',
                ], 422);
            }

            DB::table('frais_mensuel')->where('id', $id)->update(['depense_active' => false]);

            if ((bool) $request->input('couper_mois_courant')) {
                $montant       = (float) $abonnement->montant_mensuel;
                $paiementAboId = (string) Str::uuid();

                DB::table('paiements_abonnements')->insert([
                    'id'                    => $paiementAboId,
                    'abonnement'            => $id,
                    'montant'               => $montant,
                    'date_paiement'         => now(),
                    'reference_transaction' => "abonnement {$abonnement->service_paye}",
                    'user_enregistre'       => $user->id,
                    'entreprise'            => $entrepriseId,
                ]);

                DB::table('entreprises')
                    ->where('id', $entrepriseId)
                    ->decrement('argent_virtuel', $montant);

                $this->creerMouvementFinancier(
                    'paiement_abonnement',
                    'sortie',
                    $montant,
                    $entrepriseId,
                    $user->id,
                    $paiementAboId,
                    "Résiliation abonnement {$abonnement->service_paye} — dernier mois déduit"
                );
            }

            $this->history(
                'finances', 'frais_mensuel', $id,
                'résiliation abonnement',
                $request, $user->id, $entrepriseId
            );

            return response()->json(['message' => 'Abonnement résilié avec succès.'], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['abonnement_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 24 — POST /api/finances/abonnements/{id}/reactiver
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Réactive un abonnement résilié.
     *
     * Body JSON : payer_mois_courant (boolean, requis)
     */
    public function reactiver(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'payer_mois_courant' => 'required|boolean',
            ], [
                'payer_mois_courant.required' => 'Ce champ est requis.',
                'payer_mois_courant.boolean'  => 'Ce champ doit être un booléen.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

            $entreprise   = $this->currentEntreprise($request);
            $user         = $this->currentUser($request);
            $entrepriseId = $entreprise->id;

            $abonnement = DB::table('frais_mensuel')
                ->where('id', $id)
                ->where('entreprise', $entrepriseId)
                ->first();

            if (!$abonnement) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Abonnement introuvable.',
                ], 404);
            }

            if ($abonnement->depense_active) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'ALREADY_ACTIVE',
                    'message' => 'Cet abonnement est déjà actif.',
                ], 422);
            }

            DB::table('frais_mensuel')->where('id', $id)->update([
                'depense_active'  => true,
                'date_abonnement' => now()->toDateString(),
            ]);

            if ((bool) $request->input('payer_mois_courant')) {
                $montant       = (float) $abonnement->montant_mensuel;
                $paiementAboId = (string) Str::uuid();

                DB::table('paiements_abonnements')->insert([
                    'id'                    => $paiementAboId,
                    'abonnement'            => $id,
                    'montant'               => $montant,
                    'date_paiement'         => now(),
                    'reference_transaction' => "abonnement réactivé {$abonnement->service_paye}",
                    'user_enregistre'       => $user->id,
                    'entreprise'            => $entrepriseId,
                ]);

                DB::table('entreprises')
                    ->where('id', $entrepriseId)
                    ->decrement('argent_virtuel', $montant);

                $this->creerMouvementFinancier(
                    'paiement_abonnement',
                    'sortie',
                    $montant,
                    $entrepriseId,
                    $user->id,
                    $paiementAboId,
                    "Réactivation abonnement {$abonnement->service_paye} — mois courant déduit"
                );
            }

            $this->history(
                'finances', 'frais_mensuel', $id,
                'réactivation abonnement',
                $request, $user->id, $entrepriseId
            );

            return response()->json(['message' => 'Abonnement réactivé avec succès.'], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['abonnement_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 25 — GET /api/finances/abonnements/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des abonnements filtrés en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 20
     */
    /**
     * Fonction 1 — Point d'entrée export abonnements.
     */
    public function export(Request $request): Response|StreamedResponse
    {
        $entreprise   = $this->currentEntreprise($request);
        $entrepriseId = $entreprise->id;
        $format       = strtolower($request->query('format', 'pdf'));
        $statut       = $request->query('statut', 'tous');
        $dateDebut    = $request->query('date_debut');
        $dateFin      = $request->query('date_fin');

        [$from, $to] = $this->daterange($dateDebut, $dateFin);

        $rows    = $this->buildAbonnementsRows($entrepriseId, $statut, $from, $to);
        $columns = [
            'service'    => 'Service',
            'fournisseur'=> 'Fournisseur',
            'montant'    => 'Montant mensuel',
            'date'       => "Date d'abonnement",
            'statut'     => 'Statut',
        ];
        $subtitle = $statut !== 'tous' ? ucfirst($statut) : 'Tous les abonnements';
        if ($dateDebut && $dateFin) $subtitle .= " — Du $dateDebut au $dateFin";
        $filename = 'agora-abonnements-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => $this->generateCsv($rows, $columns, $filename),
            'docx'        => $this->generateDocx($rows, $columns, 'Abonnements & Frais Mensuels', $subtitle, $filename),
            default       => $this->generatePdf($rows, $columns, 'Abonnements & Frais Mensuels', $subtitle, $filename),
        };
    }

    protected function generatePdf(array $rows, array $columns, string $title, string $subtitle, string $filename): Response
    {
        return ExportService::pdf($rows, $columns, $title, $subtitle, $filename);
    }

    protected function generateDocx(array $rows, array $columns, string $title, string $subtitle, string $filename): Response
    {
        return ExportService::docx($rows, $columns, $title, $subtitle, $filename);
    }

    protected function generateCsv(array $rows, array $columns, string $filename): StreamedResponse
    {
        return ExportService::csv($rows, $columns, $filename);
    }

    private function buildAbonnementsRows(string $entrepriseId, string $statut, ?Carbon $from, ?Carbon $to): array
    {
        $query = DB::table('frais_mensuel')
            ->where('entreprise', $entrepriseId)
            ->where('actif', true);

        if ($statut === 'actif')   $query->where('depense_active', true);
        if ($statut === 'resilié') $query->where('depense_active', false);
        if ($from) $query->where('date_abonnement', '>=', $from->toDateString());
        if ($to)   $query->where('date_abonnement', '<=', $to->toDateString());

        return $query
            ->orderBy('date_abonnement', 'desc')
            ->select(['service_paye', 'fournisseur', 'montant_mensuel', 'date_abonnement', 'depense_active'])
            ->get()
            ->map(fn($r) => [
                'service'    => $r->service_paye,
                'fournisseur'=> $r->fournisseur ?? '—',
                'montant'    => ExportService::fmtMontant($r->montant_mensuel),
                'date'       => ExportService::fmtDate($r->date_abonnement),
                'statut'     => $r->depense_active ? 'Actif' : 'Résilié',
            ])
            ->toArray();
    }
}
