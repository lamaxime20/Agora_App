<?php

namespace App\Http\Controllers\Api\Finances;

use App\Services\ExportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancesReapprovisionnementController extends FinancesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 26 — GET /api/finances/reapprovisionnements/en-attente
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des ravitaillements en attente de validation Finance.
     *
     * Query params : page, per_page
     */
    public function enAttente(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page    = max(1, (int) $request->query('page', 1));
            $perPage = min(100, max(1, (int) $request->query('per_page', 20)));

            $query = DB::table('ravitaillements as r')
                ->join('produits as p', 'p.id', '=', 'r.produit')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'r.utilisateur_demande')
                ->where('r.statut', 'en_attente')
                ->where('r.entreprise', $entrepriseId)
                ->where('r.actif', true);

            $total = $query->count();

            $data = $query
                ->orderBy('r.date_creation', 'asc')
                ->forPage($page, $perPage)
                ->select([
                    'r.id',
                    'r.quantite',
                    'r.montant_a_depenser',
                    'r.date_creation',
                    'p.nom as produit',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as demandeur"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'               => $row->id,
                    'produit'          => $row->produit,
                    'quantite'         => (float) $row->quantite,
                    'montant_a_depenser'=> (float) $row->montant_a_depenser,
                    'date_creation'    => substr($row->date_creation, 0, 10),
                    'demandeur'        => $row->demandeur,
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
    // ROUTE 27 — GET /api/finances/reapprovisionnements
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Historique paginé des ravitaillements (tous sauf "en_attente").
     *
     * Query params : page, per_page, statut, date_debut, date_fin
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $statut    = $request->query('statut', 'tous');
            $dateDebut = $request->query('date_debut');
            $dateFin   = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('ravitaillements as r')
                ->join('produits as p', 'p.id', '=', 'r.produit')
                ->leftJoin('utilisateurs as ud', 'ud.id', '=', 'r.utilisateur_demande')
                ->leftJoin('utilisateurs as uc', 'uc.id', '=', 'r.user_confirmation')
                ->where('r.statut', '=', 'en_attente')
                ->where('r.entreprise', $entrepriseId)
                ->where('r.actif', true);

            if ($statut !== 'tous') {
                $query->where('r.statut', $statut);
            }

            if ($from) {
                $query->where('r.date_creation', '>=', $from);
            }
            if ($to) {
                $query->where('r.date_creation', '<=', $to);
            }

            $total = $query->count();

            $data = $query
                ->orderBy('r.date_creation', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'r.id',
                    'r.quantite',
                    'r.montant_a_depenser',
                    'r.statut',
                    'r.date_creation',
                    'r.date_validation',
                    'p.nom as produit',
                    DB::raw("CONCAT(ud.name, ' ', ud.prename) as demandeur"),
                    DB::raw("CONCAT(uc.name, ' ', uc.prename) as confirme_par"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'               => $row->id,
                    'produit'          => $row->produit,
                    'quantite'         => (float) $row->quantite,
                    'montant_a_depenser'=> (float) $row->montant_a_depenser,
                    'statut'           => $row->statut,
                    'date_creation'    => substr($row->date_creation, 0, 10),
                    'date_validation'  => $row->date_validation ? substr($row->date_validation, 0, 10) : null,
                    'demandeur'        => $row->demandeur,
                    'confirme_par'     => $row->confirme_par,
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
    // ROUTE — GET /api/finances/reapprovisionnements/historique
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Historique paginé des réapprovisionnements (validés ou refusés).
     *
     * Query params : page, per_page, statut, date_debut, date_fin
     */
    public function historique(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $statut    = $request->query('statut', 'tous');
            $dateDebut = $request->query('date_debut');
            $dateFin   = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('ravitaillements as r')
                ->join('produits as p', 'p.id', '=', 'r.produit')
                ->leftJoin('utilisateurs as ud', 'ud.id', '=', 'r.utilisateur_demande')
                ->leftJoin('utilisateurs as uc', 'uc.id', '=', 'r.user_confirmation') // Pour le décideur
                ->leftJoin('utilisateurs as ua', 'ua.id', '=', 'r.utilisateur_annulation') // Pour le décideur en cas de refus
                ->where('r.entreprise', $entrepriseId)
                ->where('r.actif', true);

            if ($statut !== 'tous') {
                // Mapping du statut frontend vers le ou les statuts backend
                $statutMapping = [
                    'valide'     => ['termine'],
                    'refuse'     => ['refuse', 'annule'],
                    'en_attente' => ['en_attente'],
                    'en_cours'   => ['en_cours'],
                ];

                if (array_key_exists($statut, $statutMapping)) {
                    $query->whereIn('r.statut', $statutMapping[$statut]);
                }
            }

            $this->applyDaterange($query, 'r.date_creation', $from, $to);

            $total = $query->count();

            $data = $query
                ->orderBy('r.date_creation', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'r.id',
                    'p.nom as produit_nom',
                    'p.unite_mesure as produit_sku', // Utilisation de l'unité de mesure comme SKU
                    'r.quantite as quantiteDemandee',
                    'r.montant_a_depenser as montantTotal',
                    'r.statut',
                    'r.date_creation as dateDemande', // Gardé pour la cohérence avec le frontend
                    DB::raw("CASE WHEN r.statut = 'termine' THEN r.date_validation ELSE r.date_annulation END as dateDecision"),
                    DB::raw("CONCAT(ud.name, ' ', ud.prename) as demandeur"),
                    DB::raw("CASE WHEN r.statut = 'termine' THEN CONCAT(uc.name, ' ', uc.prename) ELSE CONCAT(ua.name, ' ', ua.prename) END as decideur"),
                    'r.raison_annulation as motifRefus'
                ])
                ->get()
                ->map(fn($row) => [
                    'id'               => $row->id,
                    'produit'          => ['nom' => $row->produit_nom, 'sku' => $row->produit_sku],
                    'quantiteDemandee' => (float) $row->quantiteDemandee,
                    'montantTotal'     => (float) $row->montantTotal,
                    'statut'           => match ($row->statut) {
                        'termine' => 'valide',
                        'refuse' => 'refuse',
                        'annule' => 'refuse', // 'annule' est assimilé à 'refuse' côté frontend
                        'en_cours' => 'en_cours',
                        'en_attente' => 'en_attente',
                        default => $row->statut,
                    },
                    'dateDemande'      => $row->dateDemande,
                    'demandeur'        => $row->demandeur,
                    'decideur'         => $row->decideur,
                    'motifRefus'       => $row->motifRefus,
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
    // ROUTE 28 — POST /api/finances/reapprovisionnements/{id}/valider
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Valide un ravitaillement en attente (nécessite le mot de passe de l'utilisateur).
     *
     * Body JSON : mot_de_passe (requis)
     */
    public function valider(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'mot_de_passe' => 'required|string',
            ], [
                'mot_de_passe.required' => 'Le mot de passe est requis.',
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

            // Vérification du mot de passe
            $utilisateur = DB::table('utilisateurs')->where('id', $user->id)->first();

            if (!Hash::check($request->input('mot_de_passe'), $utilisateur->password_hash)) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_PASSWORD',
                    'message' => 'Mot de passe incorrect.',
                ], 401);
            }

            $ravitaillement = DB::table('ravitaillements as r')
                ->join('produits as p', 'p.id', '=', 'r.produit')
                ->where('r.id', $id)
                ->where('r.entreprise', $entrepriseId)
                ->select(['r.*', 'p.nom as produit_nom'])
                ->first();

            if (!$ravitaillement) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Réapprovisionnement introuvable.',
                ], 404);
            }

            if ($ravitaillement->statut !== 'en_attente') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_STATUS',
                    'message' => 'Ce réapprovisionnement ne peut plus être validé.',
                ], 422);
            }

            DB::table('ravitaillements')->where('id', $id)->update([
                'statut'           => 'en_cours',
                'user_confirmation'=> $user->id,
                'date_validation'  => now(),
            ]);

            $montant = (float) $ravitaillement->montant_a_depenser;

            // Réduire l'argent virtuel de l'entreprise
            DB::table('entreprises')
                ->where('id', $entrepriseId)
                ->decrement('argent_virtuel', $montant);

            // Mouvement financier
            $this->creerMouvementFinancier(
                'paiement_ravitaillement',
                'sortie',
                $montant,
                $entrepriseId,
                $user->id,
                $id,
                "Validation ravitaillement - {$ravitaillement->produit_nom} ({$ravitaillement->quantite})"
            );

            $this->history(
                'finances', 'ravitaillements', $id,
                'validation réapprovisionnement',
                $request, $user->id, $entrepriseId
            );

            // NOTIFICATIONS — À implémenter ultérieurement
            //
            // Objectif : notifier les utilisateurs du rôle Gestion de Stock que le réapprovisionnement
            //            a été validé et qu'ils doivent engager la livraison du stock.
            //
            // 1. Récupérer le rôle Gestion de Stock :
            //    $roleStock = DB::table('roles_utilisateur')
            //        ->where('role', 'gestion_stock')  // adapter selon le libellé réel
            //        ->first();
            //
            // 2. Récupérer les utilisateurs concernés :
            //    $usersStock = DB::table('appartenir_entreprise')
            //        ->where('entreprise_id', $entrepriseId)
            //        ->where('role_utilisateur_id', $roleStock->id)
            //        ->where('statut', 'actif')
            //        ->pluck('utilisateur_id');
            //
            // 3. Créer une notification pour chacun :
            //    foreach ($usersStock as $userId) {
            //        DB::table('notifications')->insert([
            //            'id'                => (string) Str::uuid(),
            //            'titre'             => 'Réapprovisionnement validé',
            //            'message'           => "Le réapprovisionnement pour {$ravitaillement->produit_nom} ({$ravitaillement->quantite}) a été validé. Veuillez engager la livraison.",
            //            'type_notification' => 'stock',
            //            'statut'            => 'non_lue',
            //            'actif'             => true,
            //            'date_arrivee'      => now(),
            //            'utilisateur'       => $userId,
            //            'entreprise'        => $entrepriseId,
            //            'role'              => $roleStock->id,
            //        ]);
            //    }

            return response()->json(['message' => 'Réapprovisionnement validé avec succès.'], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['ravitaillement_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 29 — POST /api/finances/reapprovisionnements/{id}/refuser
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Refuse un ravitaillement en attente.
     *
     * Body JSON : raison_annulation (requis)
     */
    public function refuser(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'raison_annulation' => 'required|string|max:1000',
            ], [
                'raison_annulation.required' => "La raison du refus est requise.",
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

            $ravitaillement = DB::table('ravitaillements as r')
                ->join('produits as p', 'p.id', '=', 'r.produit')
                ->where('r.id', $id)
                ->where('r.entreprise', $entrepriseId)
                ->select(['r.*', 'p.nom as produit_nom'])
                ->first();

            if (!$ravitaillement) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Réapprovisionnement introuvable.',
                ], 404);
            }

            if ($ravitaillement->statut !== 'en_attente') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_STATUS',
                    'message' => 'Ce réapprovisionnement ne peut plus être refusé.',
                ], 422);
            }

            $raisonAnnulation = $request->input('raison_annulation');

            DB::table('ravitaillements')->where('id', $id)->update([
                'statut'                => 'refuse',
                'raison_annulation'     => $raisonAnnulation,
                'utilisateur_annulation'=> $user->id,
                'date_annulation'       => now(),
            ]);

            $this->history(
                'finances', 'ravitaillements', $id,
                'refus réapprovisionnement',
                $request, $user->id, $entrepriseId,
                $raisonAnnulation
            );

            // NOTIFICATIONS — À implémenter ultérieurement
            //
            // Objectif : notifier les utilisateurs du rôle Gestion de Stock que le réapprovisionnement
            //            a été refusé, avec la raison du refus.
            //
            // 1. Récupérer le rôle Gestion de Stock :
            //    $roleStock = DB::table('roles_utilisateur')
            //        ->where('role', 'gestion_stock')  // adapter selon le libellé réel
            //        ->first();
            //
            // 2. Récupérer les utilisateurs concernés dans l'entreprise :
            //    $usersStock = DB::table('appartenir_entreprise')
            //        ->where('entreprise_id', $entrepriseId)
            //        ->where('role_utilisateur_id', $roleStock->id)
            //        ->where('statut', 'actif')
            //        ->pluck('utilisateur_id');
            //
            // 3. Créer une notification pour chacun :
            //    foreach ($usersStock as $userId) {
            //        DB::table('notifications')->insert([
            //            'id'                => (string) Str::uuid(),
            //            'titre'             => 'Réapprovisionnement refusé',
            //            'message'           => "Le réapprovisionnement pour {$ravitaillement->produit_nom} a été refusé. Raison : {$raisonAnnulation}",
            //            'type_notification' => 'stock',
            //            'statut'            => 'non_lue',
            //            'actif'             => true,
            //            'date_arrivee'      => now(),
            //            'utilisateur'       => $userId,
            //            'entreprise'        => $entrepriseId,
            //            'role'              => $roleStock->id,
            //        ]);
            //    }

            return response()->json(['message' => 'Réapprovisionnement refusé.'], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['ravitaillement_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 30 — GET /api/finances/reapprovisionnements/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des réapprovisionnements filtrés en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 27
     */
    /**
     * Fonction 1 — Point d'entrée export réapprovisionnements.
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

        $rows    = $this->buildReapproRows($entrepriseId, $statut, $from, $to);
        $columns = [
            'produit'      => 'Produit',
            'quantite'     => 'Quantité',
            'montant'      => 'Montant à dépenser',
            'statut'       => 'Statut',
            'date_creation'=> 'Date demande',
            'date_valid'   => 'Date validation',
            'demandeur'    => 'Demandeur',
            'confirme_par' => 'Confirmé par',
        ];
        $subtitle = ($dateDebut && $dateFin) ? "Du $dateDebut au $dateFin"
                  : ($dateDebut ? "Depuis le $dateDebut" : ($dateFin ? "Jusqu'au $dateFin" : 'Toutes les périodes'));
        $filename = 'agora-reapprovisionnements-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => $this->generateCsv($rows, $columns, $filename),
            'docx'        => $this->generateDocx($rows, $columns, 'Historique des Réapprovisionnements', $subtitle, $filename),
            default       => $this->generatePdf($rows, $columns, 'Historique des Réapprovisionnements', $subtitle, $filename),
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

    private function buildReapproRows(string $entrepriseId, string $statut, ?Carbon $from, ?Carbon $to): array
    {
        $query = DB::table('ravitaillements as r')
            ->join('produits as p', 'p.id', '=', 'r.produit')
            ->leftJoin('utilisateurs as ud', 'ud.id', '=', 'r.utilisateur_demande')
            ->leftJoin('utilisateurs as uc', 'uc.id', '=', 'r.user_confirmation')
            ->where('r.entreprise', $entrepriseId)
            ->where('r.actif', true);

        if ($statut !== 'tous') $query->where('r.statut', $statut);
        if ($from) $query->where('r.date_creation', '>=', $from);
        if ($to)   $query->where('r.date_creation', '<=', $to);

        return $query
            ->orderBy('r.date_creation', 'desc')
            ->select([
                'r.quantite', 'r.montant_a_depenser', 'r.statut', 'r.date_creation', 'r.date_validation',
                'p.nom as produit',
                DB::raw("CONCAT(ud.name, ' ', ud.prename) as demandeur"),
                DB::raw("CONCAT(uc.name, ' ', uc.prename) as confirme_par"),
            ])
            ->get()
            ->map(fn($r) => [
                'produit'      => $r->produit,
                'quantite'     => $r->quantite,
                'montant'      => ExportService::fmtMontant($r->montant_a_depenser),
                'statut'       => ucfirst(str_replace('_', ' ', $r->statut)),
                'date_creation'=> ExportService::fmtDate($r->date_creation),
                'date_valid'   => ExportService::fmtDate($r->date_validation),
                'demandeur'    => $r->demandeur,
                'confirme_par' => $r->confirme_par ?? '—',
            ])
            ->toArray();
    }
}
