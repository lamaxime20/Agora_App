<?php

namespace App\Http\Controllers\Api\Ventes;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class VentesCommandeController extends VentesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 5 — GET /api/ventes/commandes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des commandes avec statut métier calculé.
     *
     * Query params : page, per_page, recherche, statut, date_debut, date_fin,
     *                montant_min, montant_max
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page       = max(1, (int) $request->query('page', 1));
            $perPage    = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche  = trim((string) $request->query('recherche', ''));
            $statut     = $request->query('statut', 'tous');
            $dateDebut  = $request->query('date_debut');
            $dateFin    = $request->query('date_fin');
            $montantMin = $request->query('montant_min');
            $montantMax = $request->query('montant_max');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('commandes as c')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.entreprise', $entrepriseId)
                ->where('c.actif', true);

            if ($statut !== 'tous') {
                $this->applyStatutFilter($query, $statut);
            }

            if ($recherche !== '') {
                $query->where(function ($q) use ($recherche) {
                    $q->where(DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, ''))"), 'ilike', '%' . $recherche . '%')
                        ->orWhere(
                            DB::raw(
                                "CONCAT('CMD-', EXTRACT(YEAR FROM c.date_commande)::int, '-', " .
                                "LPAD((SELECT COUNT(c2.id) FROM commandes c2 " .
                                "WHERE c2.entreprise = c.entreprise " .
                                "AND EXTRACT(YEAR FROM c2.date_commande) = EXTRACT(YEAR FROM c.date_commande) " .
                                "AND (c2.date_commande < c.date_commande OR (c2.date_commande = c.date_commande AND c2.id::text <= c.id::text)))::text, 5, '0'))"
                            ),
                            'ilike',
                            '%' . $recherche . '%'
                        );
                });
            }

            if ($from) {
                $query->where('c.date_commande', '>=', $from);
            }
            if ($to) {
                $query->where('c.date_commande', '<=', $to);
            }
            if ($montantMin !== null) {
                $query->where('c.montant_commande', '>=', (float) $montantMin);
            }
            if ($montantMax !== null) {
                $query->where('c.montant_commande', '<=', (float) $montantMax);
            }

            $total = $query->count();

            $data = $query
                ->orderBy('c.date_commande', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'c.id',
                    'c.statut',
                    'c.montant_commande',
                    'c.date_commande',
                    $this->numeroCommandeRaw(),
                    DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client"),
                    DB::raw("(SELECT COUNT(1) FROM livraisons lv WHERE lv.commande = c.id AND lv.statut = 'livree') > 0 as a_livraison_livree"),
                    DB::raw("(SELECT COUNT(1) FROM livraisons lv WHERE lv.commande = c.id AND lv.statut = 'en_cours') > 0 as a_livraison_en_cours"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'     => $row->id,
                    'numero' => $row->numero,
                    'client' => $row->client,
                    'montant'=> (float) $row->montant_commande,
                    'statut' => $this->calculerStatutMetier($row->statut, (bool) $row->a_livraison_livree, (bool) $row->a_livraison_en_cours),
                    'date'   => substr($row->date_commande, 0, 10),
                ]);

            return response()->json([
                'data' => $data,
                'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total, 'has_more' => ($page * $perPage) < $total],
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 6 — GET /api/ventes/commandes/{id}
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Détail complet d'une commande : client, produits, paiements, livraisons.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $commande = DB::table('commandes as c')
                ->where('c.id', $id)
                ->where('c.entreprise', $entrepriseId)
                ->select([
                    'c.id', 'c.statut', 'c.montant_commande', 'c.adresse_livraison',
                    'c.date_livraison_prevue', 'c.notes_supplementaires', 'c.date_commande',
                    $this->numeroCommandeRaw(),
                    DB::raw("(SELECT COUNT(1) FROM livraisons lv WHERE lv.commande = c.id AND lv.statut = 'livree') > 0 as a_livraison_livree"),
                    DB::raw("(SELECT COUNT(1) FROM livraisons lv WHERE lv.commande = c.id AND lv.statut = 'en_cours') > 0 as a_livraison_en_cours"),
                ])
                ->first();

            if (!$commande) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            $client = DB::table('clients as cl')
                ->join('commandes as c', 'c.client', '=', 'cl.id')
                ->where('c.id', $id)
                ->select(['cl.id', 'cl.nom', 'cl.prenom', 'cl.email', 'cl.telephone'])
                ->first();

            $produits = DB::table('contenir_produit as cp')
                ->join('produits as p', 'p.id', '=', 'cp.produit_id')
                ->where('cp.commande_id', $id)
                ->select(['p.id', 'p.nom', 'cp.quantite', 'cp.prix_unitaire', 'cp.reduction', 'cp.montant'])
                ->get()
                ->map(fn($row) => [
                    'id'           => $row->id,
                    'nom'          => $row->nom,
                    'quantite'     => (float) $row->quantite,
                    'prix_unitaire'=> (float) $row->prix_unitaire,
                    'reduction'    => (float) $row->reduction,
                    'montant'      => (float) $row->montant,
                ]);

            $paiements = DB::table('payements as p')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'p.user_enregistre')
                ->where('p.commande', $id)
                ->where('p.actif', true)
                ->orderBy('p.date_payement', 'asc')
                ->select([
                    'p.montant', 'p.date_payement', 'p.mode_payement', 'p.reference_transaction',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
                ])
                ->get()
                ->map(fn($row) => [
                    'montant'               => (float) $row->montant,
                    'date'                  => substr($row->date_payement, 0, 10),
                    'mode'                  => $row->mode_payement,
                    'reference'             => $row->reference_transaction,
                    'enregistre_par'        => $row->enregistre_par,
                ]);

            $livraisons = DB::table('livraisons')
                ->where('commande', $id)
                ->orderBy('date_creation', 'asc')
                ->select(['statut', 'date_creation', 'motif_echec'])
                ->get()
                ->map(fn($row) => [
                    'statut' => $row->statut,
                    'date'   => substr($row->date_creation, 0, 10),
                    'note'   => $row->motif_echec,
                ]);

            return response()->json([
                'commande' => [
                    'id'             => $commande->id,
                    'numero'         => $commande->numero,
                    'statut'         => $this->calculerStatutMetier($commande->statut, (bool) $commande->a_livraison_livree, (bool) $commande->a_livraison_en_cours),
                    'montant'        => (float) $commande->montant_commande,
                    'adresse'        => $commande->adresse_livraison,
                    'date_livraison' => $commande->date_livraison_prevue ? substr($commande->date_livraison_prevue, 0, 10) : null,
                    'notes'          => $commande->notes_supplementaires,
                ],
                'client'   => [
                    'id'        => $client?->id,
                    'nom'       => $client?->nom,
                    'prenom'    => $client?->prenom,
                    'email'     => $client?->email,
                    'telephone' => $client?->telephone,
                ],
                'produits'   => $produits,
                'paiements'  => $paiements,
                'livraisons' => $livraisons,
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__, ['commande_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 7 — POST /api/ventes/commandes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Crée une nouvelle commande pour un client.
     *
     * Body JSON : client_id, produits[{id, quantite}], adresse_livraison,
     *             date_livraison_prevue, notes_supplementaires
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_id'              => 'required|uuid',
                'produits'               => 'required|array|min:1',
                'produits.*.id'          => 'required|uuid',
                'produits.*.quantite'    => 'required|numeric|min:0.01',
                'adresse_livraison'      => 'nullable|string|max:500',
                'date_livraison_prevue'  => 'nullable|date',
                'notes_supplementaires'  => 'nullable|string|max:2000',
            ], [
                'client_id.required'           => 'Le client est requis.',
                'client_id.uuid'               => 'L\'identifiant du client est invalide.',
                'produits.required'            => 'La liste des produits est requise.',
                'produits.min'                 => 'La commande doit contenir au moins un produit.',
                'produits.*.id.required'       => 'L\'identifiant de chaque produit est requis.',
                'produits.*.quantite.required' => 'La quantité de chaque produit est requise.',
                'produits.*.quantite.min'      => 'La quantité doit être supérieure à zéro.',
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

            $clientId = $request->input('client_id');
            $clientExists = DB::table('clients')
                ->where('id', $clientId)
                ->where('entreprise', $entrepriseId)
                ->exists();

            if (!$clientExists) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'CLIENT_NOT_FOUND',
                    'message' => 'Client introuvable dans cette entreprise.',
                ], 404);
            }

            $produitsInput = $request->input('produits');
            $produitsData  = [];
            $montantTotal  = 0;

            foreach ($produitsInput as $produitInput) {
                $produit = DB::table('produits')
                    ->where('id', $produitInput['id'])
                    ->where('entreprise', $entrepriseId)
                    ->where('statut', 'actif')
                    ->first();

                if (!$produit) {
                    return response()->json([
                        'ok'      => false,
                        'code'    => 'PRODUIT_NOT_FOUND',
                        'message' => "Produit introuvable ou inactif : {$produitInput['id']}.",
                    ], 422);
                }

                if ($produit->type_produit === 'physique') {
                    $stockReserve     = $this->getStockReserve($produit->id, $entrepriseId);
                    $stockDisponible  = (float) $produit->stock_actuel - $stockReserve;

                    if ((float) $produitInput['quantite'] > $stockDisponible) {
                        return response()->json([
                            'ok'      => false,
                            'code'    => 'STOCK_INSUFFISANT',
                            'message' => "Stock insuffisant pour le produit {$produit->nom}.",
                        ], 422);
                    }
                }

                $quantite    = (float) $produitInput['quantite'];
                $prixUnitaire= (float) $produit->prix_unitaire;
                $montant     = $quantite * $prixUnitaire;
                $montantTotal += $montant;

                $produitsData[] = [
                    'produit_id'    => $produit->id,
                    'quantite'      => $quantite,
                    'prix_unitaire' => $prixUnitaire,
                    'reduction'     => 0,
                    'montant'       => $montant,
                    'nom'           => $produit->nom,
                ];
            }

            $commandeId = (string) Str::uuid();

            DB::table('commandes')->insert([
                'id'                        => $commandeId,
                'statut'                    => 'brouillon',
                'etat_payement'             => 'non_paye',
                'montant_commande'          => $montantTotal,
                'montant_minimum_validation'=> $montantTotal,
                'adresse_livraison'         => $request->input('adresse_livraison'),
                'date_livraison_prevue'     => $request->input('date_livraison_prevue'),
                'notes_supplementaires'     => $request->input('notes_supplementaires'),
                'utilisateur_enregistre'    => $user->id,
                'client'                    => $clientId,
                'entreprise'                => $entrepriseId,
                'actif'                     => true,
                'date_commande'             => now(),
            ]);

            foreach ($produitsData as $p) {
                DB::table('contenir_produit')->insert([
                    'commande_id'  => $commandeId,
                    'produit_id'   => $p['produit_id'],
                    'quantite'     => $p['quantite'],
                    'prix_unitaire'=> $p['prix_unitaire'],
                    'reduction'    => $p['reduction'],
                    'montant'      => $p['montant'],
                ]);
            }

            $numero = DB::table('commandes as c')
                ->where('c.id', $commandeId)
                ->select([$this->numeroCommandeRaw()])
                ->first()
                ->numero ?? $commandeId;

            $this->history(
                'ventes', 'commandes', $commandeId,
                'création commande',
                $request, $user->id, $entrepriseId,
                $numero . ' - ' . $montantTotal . ' - ' . count($produitsData) . ' produit(s)'
            );

            // NOTIFICATIONS — À implémenter ultérieurement
            //
            // Objectif : notifier tous les utilisateurs ayant un rôle Finance dans l'entreprise
            //            qu'une nouvelle commande a été enregistrée et attend leur validation.
            //
            // 1. Récupérer le rôle Finance :
            //    $roleFinance = DB::table('roles_utilisateur')
            //        ->where('role', 'finance')   // adapter selon le libellé exact en base
            //        ->first();
            //
            // 2. Récupérer les utilisateurs Finance de l'entreprise :
            //    $usersFinance = DB::table('appartenir_entreprise')
            //        ->where('entreprise_id', $entrepriseId)
            //        ->where('role_utilisateur_id', $roleFinance->id)
            //        ->where('statut', 'actif')
            //        ->pluck('utilisateur_id');
            //
            // 3. Insérer une notification pour chacun :
            //    foreach ($usersFinance as $userId) {
            //        DB::table('notifications')->insert([
            //            'id'                => (string) Str::uuid(),
            //            'titre'             => 'Nouvelle commande',
            //            'message'           => "Une nouvelle commande {$numero} a été enregistrée et est en attente de validation.",
            //            'type_notification' => 'paiement',
            //            'statut'            => 'non_lue',
            //            'actif'             => true,
            //            'date_arrivee'      => now(),
            //            'utilisateur'       => $userId,
            //            'entreprise'        => $entrepriseId,
            //            'role'              => $roleFinance->id,
            //        ]);
            //    }

            return response()->json([
                'commande' => [
                    'id'     => $commandeId,
                    'numero' => $numero,
                    'statut' => 'reçu',
                    'montant'=> $montantTotal,
                    'date'   => substr(now()->toDateTimeString(), 0, 10),
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 8 — POST /api/ventes/commandes/{id}/annuler
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Annule une commande et met en échec ses livraisons en cours.
     *
     * Body JSON : raison_annulation (requis, min 20 caractères)
     */
    public function annuler(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'raison_annulation' => 'required|string|min:20|max:2000',
            ], [
                'raison_annulation.required' => 'La raison d\'annulation est requise.',
                'raison_annulation.min'      => 'La raison doit contenir au moins 20 caractères.',
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

            $commande = DB::table('commandes as c')
                ->where('c.id', $id)
                ->where('c.entreprise', $entrepriseId)
                ->select(['c.id', 'c.statut', $this->numeroCommandeRaw()])
                ->first();

            if (!$commande) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            if ($commande->statut === 'annulee') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'ALREADY_CANCELLED',
                    'message' => 'Cette commande est déjà annulée.',
                ], 409);
            }

            $aLivraisonLivree = DB::table('livraisons')
                ->where('commande', $id)
                ->where('statut', 'livree')
                ->exists();

            if ($aLivraisonLivree) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'ALREADY_DELIVERED',
                    'message' => 'Impossible d\'annuler une commande déjà livrée.',
                ], 422);
            }

            $raisonAnnulation = $request->input('raison_annulation');

            DB::table('commandes')->where('id', $id)->update([
                'statut'            => 'annulee',
                'raison_annulation' => $raisonAnnulation,
                'date_annulation'   => now(),
            ]);

            DB::table('livraisons')
                ->where('commande', $id)
                ->where('statut', 'en_cours')
                ->update([
                    'statut'                => 'echec',
                    'motif_echec'           => 'Commande annulée : ' . $raisonAnnulation,
                    'utilisateur_annulation'=> $user->id,
                    'date_annulation'       => now(),
                ]);

            $this->history(
                'ventes', 'commandes', $id,
                'annulation commande',
                $request, $user->id, $entrepriseId,
                $raisonAnnulation
            );

            // NOTIFICATIONS — À implémenter ultérieurement
            //
            // Objectif : notifier les utilisateurs Finance de l'entreprise que la commande
            //            a été annulée, avec la raison.
            //
            // 1. Récupérer le rôle Finance :
            //    $roleFinance = DB::table('roles_utilisateur')
            //        ->where('role', 'finance')
            //        ->first();
            //
            // 2. Récupérer les utilisateurs Finance de l'entreprise :
            //    $usersFinance = DB::table('appartenir_entreprise')
            //        ->where('entreprise_id', $entrepriseId)
            //        ->where('role_utilisateur_id', $roleFinance->id)
            //        ->where('statut', 'actif')
            //        ->pluck('utilisateur_id');
            //
            // 3. Insérer une notification pour chacun :
            //    $numero = $commande->numero;
            //    foreach ($usersFinance as $userId) {
            //        DB::table('notifications')->insert([
            //            'id'                => (string) Str::uuid(),
            //            'titre'             => 'Commande annulée',
            //            'message'           => "La commande {$numero} a été annulée. Raison : {$raisonAnnulation}",
            //            'type_notification' => 'paiement',
            //            'statut'            => 'non_lue',
            //            'actif'             => true,
            //            'date_arrivee'      => now(),
            //            'utilisateur'       => $userId,
            //            'entreprise'        => $entrepriseId,
            //            'role'              => $roleFinance->id,
            //        ]);
            //    }

            return response()->json(['message' => 'Commande annulée avec succès.'], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__, ['commande_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 9 — GET /api/ventes/commandes/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des commandes filtrées en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 5
     */
    public function export(Request $request): JsonResponse
    {
        $format = $request->query('format', 'pdf');

        // TODO: Implémenter la génération de fichier PDF / CSV / DOCX ($format).
        // Même logique que index() sans pagination.
        // Inclure pour chaque commande : numéro, client (nom + prénom + téléphone), montant,
        // statut calculé, date commande, adresse livraison, notes, liste des produits
        // (nom, quantité, prix unitaire, montant), historique des paiements (date, montant, mode, référence).
        // Insérer dans historiques : action = 'export commandes', details_action = $format.
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => "Export {$format} non encore implémenté.",
        ], 501);
    }
}
