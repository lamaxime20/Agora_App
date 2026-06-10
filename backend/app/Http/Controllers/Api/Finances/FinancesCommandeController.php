<?php

namespace App\Http\Controllers\Api\Finances;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FinancesCommandeController extends FinancesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 2 — GET /api/finances/commandes/a-valider
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des commandes en brouillon (en attente de validation Finance).
     *
     * Query params : page, per_page, recherche
     */
    public function aValider(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche = trim((string) $request->query('recherche', ''));

            $query = DB::table('commandes as c')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.statut', 'brouillon')
                ->where('c.entreprise', $entrepriseId)
                ->where('c.actif', true);

            if ($recherche !== '') {
                $query->where(function ($q) use ($recherche) {
                    $q->where(DB::raw(
                        "CONCAT('CMD-', EXTRACT(YEAR FROM c.date_commande)::int, '-', " .
                        "LPAD((SELECT COUNT(c2.id) FROM commandes c2 WHERE c2.entreprise = c.entreprise " .
                        "AND EXTRACT(YEAR FROM c2.date_commande) = EXTRACT(YEAR FROM c.date_commande) " .
                        "AND (c2.date_commande < c.date_commande OR (c2.date_commande = c.date_commande AND c2.id::text <= c.id::text)))::text, 5, '0'))"
                    ), 'ilike', '%' . $recherche . '%')
                        ->orWhere(DB::raw("CONCAT(cl.nom, ' ', cl.prenom)"), 'ilike', '%' . $recherche . '%');
                });
            }

            $total = $query->count();

            $data = $query
                ->orderBy('c.date_commande', 'asc')
                ->forPage($page, $perPage)
                ->select([
                    'c.id',
                    'c.montant_commande',
                    'c.date_commande',
                    DB::raw("CONCAT(cl.nom, ' ', cl.prenom) as client"),
                    $this->numeroCommandeRaw(),
                    DB::raw(
                        "(SELECT COUNT(*) FROM contenir_produit cp WHERE cp.commande_id = c.id) as produits_count"
                    ),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'               => $row->id,
                    'numero'           => $row->numero,
                    'client'           => $row->client,
                    'montant_commande' => (float) $row->montant_commande,
                    'date'             => substr($row->date_commande, 0, 10),
                    'produits_count'   => (int) $row->produits_count,
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
    // ROUTE 3 — POST /api/finances/commandes/{id}/valider
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Valide une commande brouillon : passe son statut à "validee".
     */
    public function valider(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $user         = $this->currentUser($request);
            $entrepriseId = $entreprise->id;

            $commande = DB::table('commandes as c')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.id', $id)
                ->where('c.entreprise', $entrepriseId)
                ->select([
                    'c.id', 'c.statut', 'c.date_commande', 'c.montant_commande',
                    $this->numeroCommandeRaw(),
                ])
                ->first();

            if (!$commande) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            if ($commande->statut !== 'brouillon') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_STATUS',
                    'message' => "Cette commande n'est plus en attente de validation.",
                ], 422);
            }

            DB::table('commandes')->where('id', $id)->update([
                'statut'           => 'validee',
                'utilisateur_valide' => $user->id,
                'date_validation'  => now(),
            ]);

            $this->history(
                'finances', 'commandes', $id,
                'validation commande',
                $request, $user->id, $entrepriseId,
                "Commande {$commande->numero} validée par le module Finance."
            );

            // NOTIFICATIONS — À implémenter ultérieurement
            //
            // Objectif : notifier tous les utilisateurs ayant le rôle Ventes dans cette entreprise
            // que la commande vient d'être validée par le module Finance.
            //
            // Étapes à suivre :
            //
            // 1. Récupérer le rôle "ventes" dans la table roles_utilisateur :
            //    $roleVentes = DB::table('roles_utilisateur')
            //        ->where('role', 'employe_vente')  // adapter selon le vrai libellé du rôle en base
            //        ->first();
            //
            // 2. Récupérer tous les utilisateurs ayant ce rôle dans l'entreprise :
            //    $usersVentes = DB::table('appartenir_entreprise')
            //        ->where('entreprise_id', $entrepriseId)
            //        ->where('role_utilisateur_id', $roleVentes->id)
            //        ->where('statut', 'actif')
            //        ->pluck('utilisateur_id');
            //
            // 3. Pour chaque utilisateur, insérer une notification :
            //    foreach ($usersVentes as $userId) {
            //        DB::table('notifications')->insert([
            //            'id'                => (string) Str::uuid(),
            //            'titre'             => 'Commande validée',
            //            'message'           => "La commande {$commande->numero} a été validée par le module Finance.",
            //            'type_notification' => 'paiement',
            //            'statut'            => 'non_lue',
            //            'actif'             => true,
            //            'date_arrivee'      => now(),
            //            'utilisateur'       => $userId,
            //            'entreprise'        => $entrepriseId,
            //            'role'              => $roleVentes->id,
            //        ]);
            //    }

            return response()->json(['message' => 'Commande validée avec succès.'], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['commande_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 4 — GET /api/finances/commandes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des commandes validées dont le paiement n'est pas soldé.
     *
     * Query params : page, per_page, recherche, etat_payement, date_debut, date_fin
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page          = max(1, (int) $request->query('page', 1));
            $perPage       = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche     = trim((string) $request->query('recherche', ''));
            $etatPayement  = $request->query('etat_payement', 'tous');
            $dateDebut     = $request->query('date_debut');
            $dateFin       = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('commandes as c')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.statut', 'brouillon')
                ->where('c.etat_payement', '!=', 'paye')
                ->where('c.entreprise', $entrepriseId)
                ->where('c.actif', true);

            if ($recherche !== '') {
                $query->where(function ($q) use ($recherche) {
                    $q->where(DB::raw("CONCAT(cl.nom, ' ', cl.prenom)"), 'ilike', '%' . $recherche . '%');
                });
            }

            if ($etatPayement !== 'tous') {
                $query->where('c.etat_payement', $etatPayement);
            }

            if ($from) {
                $query->where('c.date_commande', '>=', $from);
            }
            if ($to) {
                $query->where('c.date_commande', '<=', $to);
            }

            $total = $query->count();

            $data = $query
                ->orderBy('c.date_commande', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'c.id',
                    'c.montant_commande',
                    'c.montant_minimum_validation',
                    'c.etat_payement',
                    'c.date_commande',
                    DB::raw("CONCAT(cl.nom, ' ', cl.prenom) as client"),
                    $this->numeroCommandeRaw(),
                    DB::raw(
                        "(SELECT COALESCE(SUM(p.montant), 0) FROM payements p WHERE p.commande = c.id AND p.actif = true) as total_paye"
                    ),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'                          => $row->id,
                    'numero'                      => $row->numero,
                    'client'                      => $row->client,
                    'montant_commande'             => (float) $row->montant_commande,
                    'montant_minimum_validation'   => (float) ($row->montant_minimum_validation ?? $row->montant_commande),
                    'total_paye'                   => (float) $row->total_paye,
                    'etat_payement'               => $row->etat_payement,
                    'date'                         => substr($row->date_commande, 0, 10),
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
    // ROUTE 5 — GET /api/finances/commandes/{id}
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Détail complet d'une commande : informations, client, produits et paiements.
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
                    'c.id', 'c.statut', 'c.etat_payement', 'c.montant_commande',
                    'c.montant_minimum_validation', 'c.date_commande',
                    $this->numeroCommandeRaw(),
                ])
                ->first();

            if (!$commande) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            $client = DB::table('clients')
                ->join('commandes as c', 'c.client', '=', 'clients.id')
                ->where('c.id', $id)
                ->select(['clients.id', 'clients.nom', 'clients.prenom', 'clients.telephone', 'clients.email'])
                ->first();

            $produits = DB::table('contenir_produit as cp')
                ->join('produits as p', 'p.id', '=', 'cp.produit_id')
                ->where('cp.commande_id', $id)
                ->select([
                    'p.id', 'p.nom',
                    'cp.quantite', 'cp.prix_unitaire', 'cp.montant',
                ])
                ->get()
                ->map(fn($row) => [
                    'id'           => $row->id,
                    'nom'          => $row->nom,
                    'quantite'     => (float) $row->quantite,
                    'prix_unitaire'=> (float) $row->prix_unitaire,
                    'montant'      => (float) $row->montant,
                ]);

            $paiements = DB::table('payements as p')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'p.user_enregistre')
                ->where('p.commande', $id)
                ->where('p.actif', true)
                ->orderBy('p.date_payement', 'asc')
                ->select([
                    'p.id', 'p.montant', 'p.date_payement',
                    'p.mode_payement', 'p.reference_transaction',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'                   => $row->id,
                    'montant'              => (float) $row->montant,
                    'date_payement'        => $row->date_payement,
                    'mode_payement'        => $row->mode_payement,
                    'reference_transaction'=> $row->reference_transaction,
                    'enregistre_par'       => $row->enregistre_par,
                ]);

            $totalPaye = $paiements->sum('montant');

            return response()->json([
                'commande' => [
                    'id'                         => $commande->id,
                    'numero'                     => $commande->numero,
                    'statut'                     => $commande->statut,
                    'etat_payement'              => $commande->etat_payement,
                    'montant_commande'            => (float) $commande->montant_commande,
                    'montant_minimum_validation'  => (float) ($commande->montant_minimum_validation ?? $commande->montant_commande),
                    'total_paye'                 => $totalPaye,
                    'date_commande'              => substr($commande->date_commande, 0, 10),
                ],
                'client'   => $client ? [
                    'id'        => $client->id,
                    'nom'       => $client->nom,
                    'prenom'    => $client->prenom,
                    'telephone' => $client->telephone,
                    'email'     => $client->email,
                ] : null,
                'produits'  => $produits,
                'paiements' => $paiements,
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['commande_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 6 — PATCH /api/finances/commandes/{id}/montant-minimum
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Modifie le montant minimum de validation d'une commande.
     *
     * Body JSON : montant_minimum_validation (decimal, requis, > 0)
     */
    public function updateMontantMinimum(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'montant_minimum_validation' => 'required|numeric|min:0.01',
            ], [
                'montant_minimum_validation.required' => 'Le montant minimum de validation est requis.',
                'montant_minimum_validation.numeric'  => 'Le montant doit être un nombre.',
                'montant_minimum_validation.min'      => 'Le montant doit être supérieur à 0.',
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

            $commande = DB::table('commandes')
                ->where('id', $id)
                ->where('entreprise', $entrepriseId)
                ->first();

            if (!$commande) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            if ($commande->statut == 'validee' || $commande->etat_payement === 'paye') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_STATUS',
                    'message' => 'Impossible de modifier le montant minimum : commande déjà soldée ou validée.',
                ], 422);
            }

            $ancienneValeur = (float) ($commande->montant_minimum_validation ?? $commande->montant_commande);
            $nouvelleValeur = (float) $request->input('montant_minimum_validation');

            DB::table('commandes')->where('id', $id)->update([
                'montant_minimum_validation' => $nouvelleValeur,
            ]);

            $this->history(
                'finances', 'commandes', $id,
                'modification montant minimum de validation',
                $request, $user->id, $entrepriseId,
                null,
                (string) $ancienneValeur,
                (string) $nouvelleValeur
            );

            return response()->json([
                'montant_minimum_validation' => $nouvelleValeur,
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['commande_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 7 — POST /api/finances/commandes/{id}/paiements
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Enregistre un paiement sur une commande validée.
     *
     * Body JSON : montant, mode_payement, reference_transaction (optionnel sauf si mode != cash)
     */
    public function storePaiement(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'montant'               => 'required|numeric|min:0.01',
                'mode_payement'         => 'required|in:cash,mobile_money,carte_bancaire,virement,cheque',
                'reference_transaction' => 'nullable|string|max:255',
            ], [
                'montant.required'       => 'Le montant est requis.',
                'montant.min'            => 'Le montant doit être supérieur à 0.',
                'mode_payement.required' => 'Le mode de paiement est requis.',
                'mode_payement.in'       => 'Mode de paiement invalide.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

            $modePayement = $request->input('mode_payement');
            $reference    = $request->input('reference_transaction');

            if ($modePayement !== 'cash' && empty($reference)) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'VALIDATION_ERROR',
                    'message' => 'La référence de transaction est obligatoire pour ce mode de paiement.',
                ], 422);
            }

            $entreprise   = $this->currentEntreprise($request);
            $user         = $this->currentUser($request);
            $entrepriseId = $entreprise->id;

            $commande = DB::table('commandes as c')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.id', $id)
                ->where('c.entreprise', $entrepriseId)
                ->select([
                    'c.id', 'c.statut', 'c.etat_payement', 'c.montant_commande',
                    'c.montant_minimum_validation',
                    $this->numeroCommandeRaw(),
                ])
                ->first();

            if (!$commande) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            if ($commande->statut !== 'validee') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_STATUS',
                    'message' => 'Cette commande ne peut pas recevoir de paiement.',
                ], 422);
            }

            $montant    = (float) $request->input('montant');
            $payementId = (string) Str::uuid();

            DB::table('payements')->insert([
                'id'                    => $payementId,
                'commande'              => $id,
                'montant'               => $montant,
                'mode_payement'         => $modePayement,
                'reference_transaction' => $reference,
                'user_enregistre'       => $user->id,
                'entreprise'            => $entrepriseId,
                'date_payement'         => now(),
                'actif'                 => true,
            ]);

            // Recalcul total payé
            $totalPaye = (float) DB::table('payements')
                ->where('commande', $id)
                ->where('actif', true)
                ->sum('montant');

            // Détermination du nouvel état de paiement
            $montantCommande = (float) $commande->montant_commande;
            if ($totalPaye <= 0) {
                $nouvelEtat = 'non_paye';
            } elseif ($totalPaye < $montantCommande) {
                $nouvelEtat = 'partiellement_paye';
            } else {
                $nouvelEtat = 'paye';
            }

            DB::table('commandes')->where('id', $id)->update(['etat_payement' => $nouvelEtat]);

            // Augmenter l'argent virtuel de l'entreprise
            DB::table('entreprises')
                ->where('id', $entrepriseId)
                ->increment('argent_virtuel', $montant);

            // Insérer le mouvement financier
            $this->creerMouvementFinancier(
                'paiement_commande',
                'entree',
                $montant,
                $entrepriseId,
                $user->id,
                $payementId,
                "Paiement commande {$commande->numero}"
            );

            $montantMinimum    = (float) ($commande->montant_minimum_validation ?? $montantCommande);
            $minimumAtteint    = $totalPaye >= $montantMinimum;

            $this->history(
                'finances', 'commandes', $id,
                'enregistrement paiement',
                $request, $user->id, $entrepriseId,
                "{$montant} - {$modePayement}"
            );

            // NOTIFICATIONS — À implémenter ultérieurement
            //
            // Deux séries de notifications sont nécessaires après l'enregistrement d'un paiement.
            //
            // ── A) Notification au module Livraisons si le seuil minimum est atteint ──────────
            //
            // Condition : $minimumAtteint === true
            //
            // Objectif : informer les utilisateurs du rôle Livraisons que la commande est
            //            financièrement prête et peut être expédiée.
            //
            // if ($minimumAtteint) {
            //     $roleLivraisons = DB::table('roles_utilisateur')
            //         ->where('role', 'employe_livreur')  // adapter selon le libellé réel
            //         ->first();
            //
            //     if ($roleLivraisons) {
            //         $usersLivraisons = DB::table('appartenir_entreprise')
            //             ->where('entreprise_id', $entrepriseId)
            //             ->where('role_utilisateur_id', $roleLivraisons->id)
            //             ->where('statut', 'actif')
            //             ->pluck('utilisateur_id');
            //
            //         foreach ($usersLivraisons as $userId) {
            //             DB::table('notifications')->insert([
            //                 'id'                => (string) Str::uuid(),
            //                 'titre'             => 'Commande prête pour livraison',
            //                 'message'           => "La commande {$commande->numero} est prête pour la livraison (seuil de paiement atteint).",
            //                 'type_notification' => 'livraison',
            //                 'statut'            => 'non_lue',
            //                 'actif'             => true,
            //                 'date_arrivee'      => now(),
            //                 'utilisateur'       => $userId,
            //                 'entreprise'        => $entrepriseId,
            //                 'role'              => $roleLivraisons->id,
            //             ]);
            //         }
            //     }
            // }
            //
            // ── B) Notification au module Ventes ─────────────────────────────────────────────
            //
            // Objectif : informer les utilisateurs du rôle Ventes qu'un paiement a été enregistré.
            //
            // $roleVentes = DB::table('roles_utilisateur')
            //     ->where('role', 'employe_vente')  // adapter selon le libellé réel
            //     ->first();
            //
            // if ($roleVentes) {
            //     $usersVentes = DB::table('appartenir_entreprise')
            //         ->where('entreprise_id', $entrepriseId)
            //         ->where('role_utilisateur_id', $roleVentes->id)
            //         ->where('statut', 'actif')
            //         ->pluck('utilisateur_id');
            //
            //     foreach ($usersVentes as $userId) {
            //         DB::table('notifications')->insert([
            //             'id'                => (string) Str::uuid(),
            //             'titre'             => 'Paiement enregistré',
            //             'message'           => "Un paiement de {$montant} a été enregistré pour la commande {$commande->numero}.",
            //             'type_notification' => 'paiement',
            //             'statut'            => 'non_lue',
            //             'actif'             => true,
            //             'date_arrivee'      => now(),
            //             'utilisateur'       => $userId,
            //             'entreprise'        => $entrepriseId,
            //             'role'              => $roleVentes->id,
            //         ]);
            //     }
            // }

            return response()->json([
                'paiement' => [
                    'id'            => $payementId,
                    'montant'       => $montant,
                    'mode_payement' => $modePayement,
                    'date_payement' => now()->toISOString(),
                ],
                'commande' => [
                    'etat_payement'          => $nouvelEtat,
                    'total_paye'             => $totalPaye,
                    'montant_minimum_atteint'=> $minimumAtteint,
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__, ['commande_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 8 — GET /api/finances/paiements
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée de tous les paiements de l'entreprise.
     *
     * Query params : page, per_page, recherche, date_debut, date_fin, mode_payement
     */
    public function indexPaiements(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page         = max(1, (int) $request->query('page', 1));
            $perPage      = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche    = trim((string) $request->query('recherche', ''));
            $modeFilter   = $request->query('mode_payement');
            $dateDebut    = $request->query('date_debut');
            $dateFin      = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('payements as p')
                ->join('commandes as c', 'c.id', '=', 'p.commande')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'p.user_enregistre')
                ->where('p.entreprise', $entrepriseId)
                ->where('p.actif', true);

            if ($recherche !== '') {
                $query->where(function ($q) use ($recherche) {
                    $q->where('p.reference_transaction', 'ilike', '%' . $recherche . '%')
                        ->orWhere(DB::raw("CONCAT(cl.nom, ' ', cl.prenom)"), 'ilike', '%' . $recherche . '%');
                });
            }

            if ($modeFilter) {
                $query->where('p.mode_payement', $modeFilter);
            }

            if ($from) {
                $query->where('p.date_payement', '>=', $from);
            }
            if ($to) {
                $query->where('p.date_payement', '<=', $to);
            }

            $total = $query->count();

            $data = $query
                ->orderBy('p.date_payement', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'p.id',
                    'p.montant',
                    'p.date_payement',
                    'p.mode_payement',
                    'p.reference_transaction',
                    DB::raw("CONCAT(cl.nom, ' ', cl.prenom) as client"),
                    DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
                    $this->numeroCommandeRaw(),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'                    => $row->id,
                    'commande_numero'       => $row->numero,
                    'client'                => $row->client,
                    'montant'               => (float) $row->montant,
                    'mode_payement'         => $row->mode_payement,
                    'reference_transaction' => $row->reference_transaction,
                    'date_payement'         => substr($row->date_payement, 0, 10),
                    'enregistre_par'        => $row->enregistre_par,
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
    // ROUTE 9 — GET /api/finances/paiements/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des paiements filtrés en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 8
     */
    public function exportPaiements(Request $request): JsonResponse
    {
        // TODO: Implémenter la génération de fichier PDF / CSV / DOCX.
        // Utiliser les mêmes filtres que indexPaiements() sans pagination,
        // inclure en plus : montant_commande et etat_payement de la commande associée.
        // Librairies suggérées : barryvdh/laravel-dompdf (PDF), League\Csv (CSV), PhpOffice\PhpWord (DOCX).
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => 'Export non encore implémenté.',
        ], 501);
    }
}
