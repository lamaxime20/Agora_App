<?php

namespace App\Http\Controllers\Api\Livraisons;

use App\Events\Livraison\LivraisonAnnulee;
use App\Events\Livraison\LivraisonCreated;
use App\Events\Livraison\LivraisonEchec;
use App\Events\Livraison\LivraisonLancee;
use App\Events\Livraison\LivraisonRetour;
use App\Events\Livraison\LivraisonValidee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class LivraisonsActionController extends LivraisonsBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 10 — POST /api/livraisons
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Créer une livraison et assigner un livreur à une commande.
     *
     * Body JSON : commande_id (UUID), livreur_id (UUID)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'commande_id' => 'required|uuid',
                'livreur_id'  => 'required|uuid',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'VALIDATION_ERROR',
                    'message' => 'Données invalides.',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $user         = $this->currentUser($request);
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $commandeId   = $request->input('commande_id');
            $livreurId    = $request->input('livreur_id');

            // 1. Vérifier existence de la commande
            $commande = DB::table('commandes')
                ->where('id', $commandeId)
                ->where('entreprise', $entrepriseId)
                ->where('actif', true)
                ->first();

            if (!$commande) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            // 2. Commande validée ?
            if ($commande->statut !== 'validee') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_STATUS',
                    'message' => "La commande n'est pas validée.",
                ], 422);
            }

            // 3. Seuil minimum de paiement atteint ?
            $totalPaye = (float) DB::table('payements')
                ->where('commande', $commandeId)
                ->where('actif', true)
                ->sum('montant');

            $seuil = $commande->montant_minimum_validation ?? $commande->montant_commande;

            if ($totalPaye < (float) $seuil) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'PAYMENT_THRESHOLD',
                    'message' => "Le seuil minimum de paiement n'a pas été atteint pour cette commande.",
                ], 422);
            }

            // 4. Pas déjà livrée
            $dejaLivree = DB::table('livraisons')
                ->where('commande', $commandeId)
                ->where('statut', 'livree')
                ->where('actif', true)
                ->exists();

            if ($dejaLivree) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'ALREADY_DELIVERED',
                    'message' => 'Cette commande a déjà été livrée.',
                ], 422);
            }

            // 5. Pas de livraison en cours
            $enCours = DB::table('livraisons')
                ->where('commande', $commandeId)
                ->where('statut', 'en_cours')
                ->where('actif', true)
                ->exists();

            if ($enCours) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'ALREADY_IN_PROGRESS',
                    'message' => 'Une livraison est déjà en cours pour cette commande.',
                ], 422);
            }

            // 6. Livreur valide dans l'entreprise avec le bon rôle
            $livreurValide = DB::table('appartenir_entreprise as ae')
                ->join('roles_utilisateur as ru', 'ru.id', '=', 'ae.role_utilisateur_id')
                ->where('ae.utilisateur_id', $livreurId)
                ->where('ae.entreprise_id', $entrepriseId)
                ->where('ae.statut', 'actif')
                ->whereIn('ru.role', ['employe_livraison', 'manager_livraison'])
                ->exists();

            if (!$livreurValide) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_LIVREUR',
                    'message' => "Ce livreur n'appartient pas à l'entreprise ou n'a pas le rôle requis.",
                ], 422);
            }

            // 7. Insérer la livraison
            $livraisonId = (string) Str::uuid();
            $now         = now();

            DB::table('livraisons')->insert([
                'id'           => $livraisonId,
                'commande'     => $commandeId,
                'livreur'      => $livreurId,
                'statut'       => 'en_cours',
                'date_creation'=> $now,
                'actif'        => true,
            ]);

            // 8. Calcul des numéros pour la réponse
            $numeroLiv = $this->calcNumeroLivraison($livraisonId, $entrepriseId);
            $numeroCMD = $this->calcNumeroCommande($commandeId);

            // 9. Récupérer nom du livreur pour l'historique
            $livreurRow = DB::table('utilisateurs')
                ->where('id', $livreurId)
                ->select(['name', 'prename'])
                ->first();
            $nomLivreur = $livreurRow ? $livreurRow->name . ' ' . $livreurRow->prename : $livreurId;

            // 10. NOTIFICATIONS
            $livreurRoleRow = DB::table('appartenir_entreprise as ae')
                ->join('roles_utilisateur as ru', 'ru.id', '=', 'ae.role_utilisateur_id')
                ->where('ae.utilisateur_id', $livreurId)
                ->where('ae.entreprise_id', $entrepriseId)
                ->whereIn('ru.role', ['employe_livraison', 'manager_livraison'])
                ->select('ae.role_utilisateur_id')
                ->first();

            $clientRow = DB::table('commandes as c')
                ->leftJoin('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.id', $commandeId)
                ->select(['cl.nom as client_nom'])
                ->first();

            if ($livreurRoleRow) {
                event(new LivraisonCreated(
                    companyId:     $entrepriseId,
                    livraisonId:   $livraisonId,
                    commandeId:    $commandeId,
                    livreurUserId: $livreurId,
                    livreurRoleId: $livreurRoleRow->role_utilisateur_id,
                    clientNom:     $clientRow?->client_nom ?? 'Client inconnu'
                ));
            }

            // 11. Historique
            $this->history(
                'livraisons', 'livraisons', $livraisonId,
                'création livraison', $request,
                $user->id, $entrepriseId,
                "{$numeroCMD} → {$nomLivreur}"
            );

            return response()->json([
                'livraison' => [
                    'id'           => $livraisonId,
                    'numero'       => $numeroLiv,
                    'statut'       => 'en_cours',
                    'dateCreation' => $now,
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 11 — POST /api/livraisons/{id}/lancer
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Enregistrer la date de lancement d'une livraison.
     */
    public function lancer(Request $request, string $id): JsonResponse
    {
        try {
            $user         = $this->currentUser($request);
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $livraison = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('l.id', $id)
                ->where('l.actif', true)
                ->where('c.entreprise', $entrepriseId)
                ->select(['l.id', 'l.statut', 'l.date_lancement', 'l.commande'])
                ->first();

            if (!$livraison) {
                return response()->json([
                    'ok' => false, 'code' => 'NOT_FOUND',
                    'message' => 'Livraison introuvable.',
                ], 404);
            }

            if ($livraison->statut !== 'en_cours') {
                return response()->json([
                    'ok' => false, 'code' => 'INVALID_STATUS',
                    'message' => 'Cette livraison ne peut pas être lancée.',
                ], 422);
            }

            if ($livraison->date_lancement !== null) {
                return response()->json([
                    'ok' => false, 'code' => 'ALREADY_LAUNCHED',
                    'message' => 'Cette livraison est déjà lancée.',
                ], 422);
            }

            $dateLancement = now();
            DB::table('livraisons')->where('id', $id)->update(['date_lancement' => $dateLancement]);

            $numeroCMD = $this->calcNumeroCommande($livraison->commande);

            // NOTIFICATIONS
            $clientRowL = DB::table('commandes as c')
                ->leftJoin('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.id', $livraison->commande)
                ->select(['cl.nom as client_nom'])
                ->first();

            event(new LivraisonLancee(
                companyId:  $entrepriseId,
                livraisonId: $id,
                commandeId: $livraison->commande,
                clientNom:  $clientRowL?->client_nom ?? 'Client inconnu'
            ));

            $this->history(
                'livraisons', 'livraisons', $id,
                'lancement livraison', $request,
                $user->id, $entrepriseId
            );

            return response()->json([
                'message'       => 'Livraison lancée.',
                'dateLancement' => $dateLancement,
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__, ['livraison_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 12 — POST /api/livraisons/{id}/valider
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Confirmer la livraison et décrémenter le stock des produits physiques.
     */
    public function valider(Request $request, string $id): JsonResponse
    {
        try {
            $user         = $this->currentUser($request);
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $livraison = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('l.id', $id)
                ->where('l.actif', true)
                ->where('c.entreprise', $entrepriseId)
                ->select(['l.id', 'l.statut', 'l.date_lancement', 'l.commande'])
                ->first();

            if (!$livraison) {
                return response()->json([
                    'ok' => false, 'code' => 'NOT_FOUND',
                    'message' => 'Livraison introuvable.',
                ], 404);
            }

            if ($livraison->statut !== 'en_cours') {
                return response()->json([
                    'ok' => false, 'code' => 'INVALID_STATUS',
                    'message' => 'Cette livraison ne peut pas être validée.',
                ], 422);
            }

            if ($livraison->date_lancement === null) {
                return response()->json([
                    'ok' => false, 'code' => 'NOT_LAUNCHED',
                    'message' => 'La livraison doit être lancée avant d\'être validée.',
                ], 422);
            }

            $dateLivraison = now();
            DB::table('livraisons')->where('id', $id)->update([
                'statut'                  => 'livree',
                'date_livraison_effective'=> $dateLivraison,
            ]);

            // Décrémenter le stock des produits physiques
            $produitsCommande = DB::table('contenir_produit as cp')
                ->join('produits as p', 'p.id', '=', 'cp.produit_id')
                ->where('cp.commande_id', $livraison->commande)
                ->where('p.type_produit', 'physique')
                ->select(['p.id as produit_id', 'cp.quantite', 'p.stock_actuel'])
                ->get();

            foreach ($produitsCommande as $produit) {
                $nouveauStock = max(0, (float) $produit->stock_actuel - (float) $produit->quantite);
                DB::table('produits')
                    ->where('id', $produit->produit_id)
                    ->update(['stock_actuel' => $nouveauStock]);
            }

            $numeroCMD = $this->calcNumeroCommande($livraison->commande);

            // NOTIFICATIONS
            $commandeInfoV = DB::table('commandes as c')
                ->leftJoin('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.id', $livraison->commande)
                ->select(['c.montant_commande', 'cl.nom as client_nom'])
                ->first();

            event(new LivraisonValidee(
                companyId:    $entrepriseId,
                livraisonId:  $id,
                commandeId:   $livraison->commande,
                clientNom:    $commandeInfoV?->client_nom ?? 'Client inconnu',
                montantTotal: (float) ($commandeInfoV?->montant_commande ?? 0)
            ));

            // Notifier les utilisateurs Gestion de Stock que le stock a été mis à jour.
            // foreach ($rolesStock as $roleSlug) {
            //     foreach ($this->getUsersByRole($entrepriseId, $roleSlug) as $u) {
            //         DB::table('notifications')->insert([
            //             'id'                => (string) Str::uuid(),
            //             'titre'             => 'Stock mis à jour',
            //             'message'           => "Stock mis à jour suite à la livraison confirmée de la commande {$numeroCMD}.",
            //             'type_notification' => 'stock',
            //             'statut'            => 'non_lue',
            //             'actif'             => true,
            //             'utilisateur'       => $u->id,
            //             'entreprise'        => $entrepriseId,
            //             'role'              => $u->role_id,
            //             'date_arrivee'      => now(),
            //         ]);
            //     }
            // }

            $this->history(
                'livraisons', 'livraisons', $id,
                'validation livraison', $request,
                $user->id, $entrepriseId
            );

            return response()->json(['message' => 'Livraison validée avec succès.'], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__, ['livraison_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 13 — POST /api/livraisons/{id}/echec
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Déclarer un échec de livraison (livraison déjà lancée).
     *
     * Body JSON : motif (string, min:20)
     */
    public function echec(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'motif' => 'required|string|min:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok' => false, 'code' => 'VALIDATION_ERROR',
                    'message' => 'Le motif est requis (minimum 20 caractères).',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $user         = $this->currentUser($request);
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $motif        = $request->input('motif');

            $livraison = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('l.id', $id)
                ->where('l.actif', true)
                ->where('c.entreprise', $entrepriseId)
                ->select(['l.id', 'l.statut', 'l.date_lancement', 'l.commande'])
                ->first();

            if (!$livraison) {
                return response()->json([
                    'ok' => false, 'code' => 'NOT_FOUND',
                    'message' => 'Livraison introuvable.',
                ], 404);
            }

            if ($livraison->statut !== 'en_cours') {
                return response()->json([
                    'ok' => false, 'code' => 'INVALID_STATUS',
                    'message' => 'Cette livraison ne peut pas être marquée comme échouée.',
                ], 422);
            }

            if ($livraison->date_lancement === null) {
                return response()->json([
                    'ok' => false, 'code' => 'NOT_LAUNCHED',
                    'message' => "La livraison doit être lancée avant de déclarer un échec. Utilisez Annuler pour une livraison non lancée.",
                ], 422);
            }

            DB::table('livraisons')->where('id', $id)->update([
                'statut'      => 'echec',
                'motif_echec' => $motif,
            ]);

            $numeroCMD = $this->calcNumeroCommande($livraison->commande);

            // NOTIFICATIONS
            $clientRowE = DB::table('commandes as c')
                ->leftJoin('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.id', $livraison->commande)
                ->select(['cl.nom as client_nom'])
                ->first();

            event(new LivraisonEchec(
                companyId:  $entrepriseId,
                livraisonId: $id,
                commandeId: $livraison->commande,
                clientNom:  $clientRowE?->client_nom ?? 'Client inconnu',
                motif:      $motif
            ));

            $this->history(
                'livraisons', 'livraisons', $id,
                'échec livraison', $request,
                $user->id, $entrepriseId, $motif
            );

            return response()->json(['message' => 'Livraison marquée comme échouée.'], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__, ['livraison_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 14 — POST /api/livraisons/{id}/retour
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Déclarer un retour de livraison (livraison déjà lancée).
     *
     * Body JSON : motif (string, min:20)
     */
    public function retour(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'motif' => 'required|string|min:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok' => false, 'code' => 'VALIDATION_ERROR',
                    'message' => 'Le motif est requis (minimum 20 caractères).',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $user         = $this->currentUser($request);
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $motif        = $request->input('motif');

            $livraison = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('l.id', $id)
                ->where('l.actif', true)
                ->where('c.entreprise', $entrepriseId)
                ->select(['l.id', 'l.statut', 'l.date_lancement', 'l.commande'])
                ->first();

            if (!$livraison) {
                return response()->json([
                    'ok' => false, 'code' => 'NOT_FOUND',
                    'message' => 'Livraison introuvable.',
                ], 404);
            }

            if ($livraison->statut !== 'en_cours') {
                return response()->json([
                    'ok' => false, 'code' => 'INVALID_STATUS',
                    'message' => 'Cette livraison ne peut pas être retournée.',
                ], 422);
            }

            if ($livraison->date_lancement === null) {
                return response()->json([
                    'ok' => false, 'code' => 'NOT_LAUNCHED',
                    'message' => "La livraison doit être lancée avant de déclarer un retour. Utilisez Annuler pour une livraison non lancée.",
                ], 422);
            }

            DB::table('livraisons')->where('id', $id)->update([
                'statut'       => 'retour',
                'motif_retour' => $motif,
            ]);

            $numeroCMD = $this->calcNumeroCommande($livraison->commande);

            // NOTIFICATIONS
            $clientRowR = DB::table('commandes as c')
                ->leftJoin('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.id', $livraison->commande)
                ->select(['cl.nom as client_nom'])
                ->first();

            event(new LivraisonRetour(
                companyId:  $entrepriseId,
                livraisonId: $id,
                commandeId: $livraison->commande,
                clientNom:  $clientRowR?->client_nom ?? 'Client inconnu',
                motif:      $motif
            ));

            $this->history(
                'livraisons', 'livraisons', $id,
                'retour livraison', $request,
                $user->id, $entrepriseId, $motif
            );

            return response()->json(['message' => 'Retour de livraison enregistré.'], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__, ['livraison_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 15 — POST /api/livraisons/{id}/annuler
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Annuler une livraison non encore lancée.
     *
     * Body JSON : motif (string, min:20)
     */
    public function annuler(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'motif' => 'required|string|min:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok' => false, 'code' => 'VALIDATION_ERROR',
                    'message' => 'Le motif est requis (minimum 20 caractères).',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $user         = $this->currentUser($request);
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $motif        = $request->input('motif');

            $livraison = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('l.id', $id)
                ->where('l.actif', true)
                ->where('c.entreprise', $entrepriseId)
                ->select(['l.id', 'l.statut', 'l.date_lancement', 'l.commande'])
                ->first();

            if (!$livraison) {
                return response()->json([
                    'ok' => false, 'code' => 'NOT_FOUND',
                    'message' => 'Livraison introuvable.',
                ], 404);
            }

            if ($livraison->statut !== 'en_cours') {
                return response()->json([
                    'ok' => false, 'code' => 'INVALID_STATUS',
                    'message' => 'Cette livraison ne peut pas être annulée.',
                ], 422);
            }

            if ($livraison->date_lancement !== null) {
                return response()->json([
                    'ok' => false, 'code' => 'ALREADY_LAUNCHED',
                    'message' => "Une livraison déjà lancée ne peut pas être annulée. Utilisez Échec ou Retour.",
                ], 422);
            }

            DB::table('livraisons')->where('id', $id)->update([
                'statut'                => 'echec',
                'motif_echec'           => $motif,
                'raison_annulation'     => $motif,
                'utilisateur_annulation'=> $user->id,
                'date_annulation'       => now(),
            ]);

            $numeroCMD = $this->calcNumeroCommande($livraison->commande);

            // NOTIFICATIONS
            $clientRowA = DB::table('commandes as c')
                ->leftJoin('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.id', $livraison->commande)
                ->select(['cl.nom as client_nom'])
                ->first();

            event(new LivraisonAnnulee(
                companyId:  $entrepriseId,
                livraisonId: $id,
                commandeId: $livraison->commande,
                clientNom:  $clientRowA?->client_nom ?? 'Client inconnu',
                motif:      $motif
            ));

            $this->history(
                'livraisons', 'livraisons', $id,
                'annulation livraison', $request,
                $user->id, $entrepriseId, $motif
            );

            return response()->json(['message' => 'Livraison annulée.'], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__, ['livraison_id' => $id]);
        }
    }
}
