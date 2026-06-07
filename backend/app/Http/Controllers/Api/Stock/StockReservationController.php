<?php

namespace App\Http\Controllers\Api\Stock;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockReservationController extends StockBaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);
            $page       = max(1, (int) $request->query('page', 1));
            $limit      = min(100, max(1, (int) $request->query('limit', 25)));
            $search     = trim((string) $request->query('search', ''));
            $statut     = $request->query('statut');
            [$dateDebut, $dateFin] = $this->daterange($request->query('dateDebut'), $request->query('dateFin'));

            $query = DB::table('commandes as c')
                ->leftJoin('clients as cl', 'cl.id', '=', 'c.client')
                ->leftJoin('utilisateurs as ue', 'ue.id', '=', 'c.utilisateur_enregistre')
                ->leftJoin('utilisateurs as uv', 'uv.id', '=', 'c.utilisateur_valide')
                ->where('c.entreprise', $entreprise->id);

            if ($statut) {
                $query->where('c.statut', $statut);
            }

            if ($search !== '') {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('c.id', 'ilike', '%' . $search . '%')
                        ->orWhere('cl.nom', 'ilike', '%' . $search . '%')
                        ->orWhere('cl.prenom', 'ilike', '%' . $search . '%');
                });
            }

            if ($dateDebut) {
                $query->where('c.date_commande', '>=', $dateDebut);
            }

            if ($dateFin) {
                $query->where('c.date_commande', '<=', $dateFin);
            }

            $total = $query->count();

            $commandes = $query->orderByDesc('c.date_commande')
                ->forPage($page, $limit)
                ->select([
                    'c.id', 'c.date_commande', 'c.statut', 'c.etat_payement',
                    'c.montant_commande', 'c.montant_minimum_validation',
                    'c.adresse_livraison', 'c.date_livraison_prevue', 'c.notes_supplementaires',
                    'c.date_validation', 'c.date_annulation', 'c.raison_annulation',
                    'cl.id as client_id', 'cl.nom as client_nom', 'cl.prenom as client_prenom', 'cl.email as client_email',
                    'ue.id as ue_id', 'ue.name as ue_nom', 'ue.prename as ue_prenom',
                    'uv.id as uv_id', 'uv.name as uv_nom', 'uv.prename as uv_prenom',
                ])
                ->get();

            $commandeIds = $commandes->pluck('id')->all();

            $lignesMap     = collect();
            $livraisonsMap = collect();

            if (!empty($commandeIds)) {
                $lignesMap = DB::table('contenir_produit as cp')
                    ->leftJoin('produits as p', 'p.id', '=', 'cp.produit_id')
                    ->whereIn('cp.commande_id', $commandeIds)
                    ->select([
                        'cp.commande_id', 'cp.produit_id', 'cp.quantite',
                        'cp.prix_unitaire', 'cp.reduction', 'cp.montant',
                        'p.nom as produit_nom', 'p.type_produit as produit_type',
                    ])
                    ->get()
                    ->groupBy('commande_id');

                $livraisonsMap = DB::table('livraisons as l')
                    ->whereIn('l.commande', $commandeIds)
                    ->select([
                        'l.id', 'l.statut', 'l.date_creation', 'l.date_livraison_effective',
                        'l.motif_echec', 'l.motif_retour', 'l.date_lancement',
                        'l.date_annulation', 'l.raison_annulation', 'l.commande', 'l.livreur',
                    ])
                    ->get()
                    ->groupBy('commande');
            }

            $mapped = $commandes->map(fn($row) => $this->commandeRowPayload($row, $lignesMap, $livraisonsMap));

            $kpis = DB::table('commandes as c')
                ->join('contenir_produit as cp', 'cp.commande_id', '=', 'c.id')
                ->where('c.entreprise', $entreprise->id)
                ->where('c.statut', 'validee')
                ->selectRaw('COUNT(DISTINCT c.id) as commandes_actives, COALESCE(SUM(cp.quantite), 0) as articles_total, COALESCE(SUM(cp.montant), 0) as valeur_totale')
                ->first();

            return response()->json([
                'data' => [
                    'commandes' => $mapped,
                    'total'     => $total,
                    'kpis'      => [
                        'actives'        => (int) ($kpis->commandes_actives ?? 0),
                        'articles_total' => (float) ($kpis->articles_total ?? 0),
                        'valeur_totale'  => (float) ($kpis->valeur_totale ?? 0),
                    ],
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'index']);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);

            $commande = DB::table('commandes as c')
                ->leftJoin('clients as cl', 'cl.id', '=', 'c.client')
                ->leftJoin('utilisateurs as ue', 'ue.id', '=', 'c.utilisateur_enregistre')
                ->leftJoin('utilisateurs as uv', 'uv.id', '=', 'c.utilisateur_valide')
                ->where('c.id', $id)
                ->where('c.entreprise', $entreprise->id)
                ->select([
                    'c.id', 'c.date_commande', 'c.statut', 'c.etat_payement',
                    'c.montant_commande', 'c.montant_minimum_validation',
                    'c.adresse_livraison', 'c.date_livraison_prevue', 'c.notes_supplementaires',
                    'c.date_validation', 'c.date_annulation', 'c.raison_annulation',
                    'cl.id as client_id', 'cl.nom as client_nom', 'cl.prenom as client_prenom', 'cl.email as client_email',
                    'ue.id as ue_id', 'ue.name as ue_nom', 'ue.prename as ue_prenom',
                    'uv.id as uv_id', 'uv.name as uv_nom', 'uv.prename as uv_prenom',
                ])
                ->first();

            if (!$commande) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            $lignes = DB::table('contenir_produit as cp')
                ->leftJoin('produits as p', 'p.id', '=', 'cp.produit_id')
                ->where('cp.commande_id', $commande->id)
                ->select([
                    'cp.commande_id', 'cp.produit_id', 'cp.quantite',
                    'cp.prix_unitaire', 'cp.reduction', 'cp.montant',
                    'p.nom as produit_nom', 'p.type_produit as produit_type',
                ])
                ->get();

            $livraisons = DB::table('livraisons as l')
                ->where('l.commande', $commande->id)
                ->select([
                    'l.id', 'l.statut', 'l.date_creation', 'l.date_livraison_effective',
                    'l.motif_echec', 'l.motif_retour', 'l.date_lancement',
                    'l.date_annulation', 'l.raison_annulation', 'l.commande', 'l.livreur',
                ])
                ->get();

            $lignesMap     = collect([$commande->id => $lignes]);
            $livraisonsMap = collect([$commande->id => $livraisons]);

            return response()->json([
                'data' => [
                    'commande' => $this->commandeRowPayload($commande, $lignesMap, $livraisonsMap, true),
                    'lignes'   => $lignes->map(fn($ligne) => [
                        'commande_id'   => $ligne->commande_id,
                        'produit_id'    => $ligne->produit_id,
                        'quantite'      => (float) $ligne->quantite,
                        'prix_unitaire' => (float) $ligne->prix_unitaire,
                        'reduction'     => (float) $ligne->reduction,
                        'montant'       => (float) $ligne->montant,
                        'produit'       => $ligne->produit_id ? [
                            'id'   => $ligne->produit_id,
                            'nom'  => $ligne->produit_nom,
                            'type' => $ligne->produit_type,
                        ] : null,
                    ])->values(),
                    'livraison' => $livraisons->first()
                        ? $this->livraisonRowPayload($livraisons->first())
                        : null,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'show', 'id' => $id]);
        }
    }

    private function commandeRowPayload(object $row, $lignesMap, $livraisonsMap, bool $withLines = false): array
    {
        $lignes     = $lignesMap->get($row->id, collect());
        $livraisons = $livraisonsMap->get($row->id, collect());
        $stockReserve = $lignes->sum('quantite');

        return [
            'id'                         => $row->id,
            'date_commande'              => $row->date_commande,
            'statut'                     => $row->statut,
            'etat_payement'              => $row->etat_payement,
            'montant_commande'           => (float) $row->montant_commande,
            'montant_minimum_validation' => (float) ($row->montant_minimum_validation ?? 0),
            'adresse_livraison'          => $row->adresse_livraison,
            'date_livraison_prevue'      => $row->date_livraison_prevue,
            'notes_supplementaires'      => $row->notes_supplementaires,
            'date_validation'            => $row->date_validation,
            'date_annulation'            => $row->date_annulation,
            'raison_annulation'          => $row->raison_annulation,
            'client'                     => $row->client_id ? [
                'id'    => $row->client_id,
                'nom'   => $row->client_nom,
                'prenom'=> $row->client_prenom,
                'email' => $row->client_email,
            ] : null,
            'utilisateur_enregistre'     => $row->ue_id ? [
                'id'    => $row->ue_id,
                'nom'   => $row->ue_nom,
                'prenom'=> $row->ue_prenom,
            ] : null,
            'utilisateur_valide'         => $row->uv_id ? [
                'id'    => $row->uv_id,
                'nom'   => $row->uv_nom,
                'prenom'=> $row->uv_prenom,
            ] : null,
            'stock_reserve'              => (float) $stockReserve,
            'etat_metier'                => $this->etatMetierFromRow($row->statut, $livraisons),
            'lignes'                     => $withLines ? $lignes->map(fn($ligne) => [
                'commande_id'   => $ligne->commande_id,
                'produit_id'    => $ligne->produit_id,
                'quantite'      => (float) $ligne->quantite,
                'prix_unitaire' => (float) $ligne->prix_unitaire,
                'reduction'     => (float) $ligne->reduction,
                'montant'       => (float) $ligne->montant,
            ])->values() : null,
        ];
    }

    private function livraisonRowPayload(object $livraison): array
    {
        return [
            'id'                       => $livraison->id,
            'date_creation'            => $livraison->date_creation,
            'date_livraison_effective' => $livraison->date_livraison_effective,
            'statut'                   => $livraison->statut,
            'motif_echec'              => $livraison->motif_echec,
            'motif_retour'             => $livraison->motif_retour,
            'date_lancement'           => $livraison->date_lancement,
            'date_annulation'          => $livraison->date_annulation,
            'raison_annulation'        => $livraison->raison_annulation,
            'commande'                 => $livraison->commande,
            'livreur'                  => $livraison->livreur,
        ];
    }

    private function etatMetierFromRow(string $statut, $livraisons): string
    {
        if ($statut === 'brouillon') {
            return 'reçue';
        }

        if ($statut === 'annulee') {
            return 'annulée';
        }

        if ($livraisons->contains('statut', 'livree')) {
            return 'livrée';
        }

        if ($livraisons->contains('statut', 'en_cours')) {
            return 'en cours de livraison';
        }

        return 'validée';
    }
}
