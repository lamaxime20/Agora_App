<?php

namespace App\Http\Controllers\Api\Finances;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

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
    public function export(Request $request): JsonResponse
    {
        // TODO: Implémenter la génération de fichier PDF / CSV / DOCX.
        // Même logique que index() sans pagination.
        // Inclure en plus : raison_annulation si le statut est "refuse".
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => 'Export non encore implémenté.',
        ], 501);
    }
}
