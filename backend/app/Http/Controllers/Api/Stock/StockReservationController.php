<?php

namespace App\Http\Controllers\Api\Stock;

use App\Models\Commande;
use App\Models\Livraison;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockReservationController extends StockBaseController
{
    public function index(Request $request): JsonResponse
    {
        $entreprise = $this->currentEntreprise($request);
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 25)));
        $search = trim((string) $request->query('search', ''));
        $statut = $request->query('statut');
        [$dateDebut, $dateFin] = $this->daterange($request->query('dateDebut'), $request->query('dateFin'));

        $query = Commande::with(['client', 'utilisateurEnregistre', 'utilisateurValide', 'lignes.produit', 'livraisons'])
            ->where('entreprise', $entreprise->id);

        if ($statut) {
            $query->where('statut', $statut);
        }

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('id', 'ilike', '%' . $search . '%')
                    ->orWhereHas('client', function ($clientQuery) use ($search) {
                        $clientQuery->where('nom', 'ilike', '%' . $search . '%')
                            ->orWhere('prenom', 'ilike', '%' . $search . '%');
                    });
            });
        }

        if ($dateDebut) {
            $query->where('date_commande', '>=', $dateDebut);
        }

        if ($dateFin) {
            $query->where('date_commande', '<=', $dateFin);
        }

        $total = $query->count();
        $commandes = $query->orderByDesc('date_commande')
            ->forPage($page, $limit)
            ->get()
            ->map(fn(Commande $commande) => $this->commandePayload($commande));

        $kpis = DB::table('commandes as c')
            ->join('contenir_produit as cp', 'cp.commande_id', '=', 'c.id')
            ->where('c.entreprise', $entreprise->id)
            ->where('c.statut', 'validee')
            ->selectRaw('COUNT(DISTINCT c.id) as commandes_actives, COALESCE(SUM(cp.quantite), 0) as articles_total, COALESCE(SUM(cp.montant), 0) as valeur_totale')
            ->first();

        return response()->json([
            'data' => [
                'commandes' => $commandes,
                'total'     => $total,
                'kpis'      => [
                    'actives'       => (int) ($kpis->commandes_actives ?? 0),
                    'articles_total'=> (float) ($kpis->articles_total ?? 0),
                    'valeur_totale' => (float) ($kpis->valeur_totale ?? 0),
                ],
            ],
        ], 200);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $entreprise = $this->currentEntreprise($request);

        $commande = Commande::with(['client', 'utilisateurEnregistre', 'utilisateurValide', 'lignes.produit', 'livraisons'])
            ->where('id', $id)
            ->where('entreprise', $entreprise->id)
            ->first();

        if (!$commande) {
            return response()->json([
                'ok'      => false,
                'code'    => 'NOT_FOUND',
                'message' => 'Commande introuvable.',
            ], 404);
        }

        return response()->json([
            'data' => [
                'commande' => $this->commandePayload($commande, true),
                'lignes'   => $commande->lignes->map(fn($ligne) => [
                    'commande_id'   => $ligne->commande_id,
                    'produit_id'    => $ligne->produit_id,
                    'quantite'      => (float) $ligne->quantite,
                    'prix_unitaire' => (float) $ligne->prix_unitaire,
                    'reduction'     => (float) $ligne->reduction,
                    'montant'       => (float) $ligne->montant,
                    'produit'       => $ligne->produit ? [
                        'id'   => $ligne->produit->id,
                        'nom'  => $ligne->produit->nom,
                        'type' => $ligne->produit->type_produit,
                    ] : null,
                ])->values(),
                'livraison' => $commande->livraisons->first() ? $this->livraisonPayload($commande->livraisons->first()) : null,
            ],
        ], 200);
    }

    private function commandePayload(Commande $commande, bool $withLines = false): array
    {
        $stockReserve = $commande->lignes->sum('quantite');

        return [
            'id'                         => $commande->id,
            'date_commande'              => $commande->date_commande,
            'statut'                     => $commande->statut,
            'etat_payement'              => $commande->etat_payement,
            'montant_commande'           => (float) $commande->montant_commande,
            'montant_minimum_validation' => (float) ($commande->montant_minimum_validation ?? 0),
            'adresse_livraison'          => $commande->adresse_livraison,
            'date_livraison_prevue'      => $commande->date_livraison_prevue,
            'notes_supplementaires'      => $commande->notes_supplementaires,
            'date_validation'            => $commande->date_validation,
            'date_annulation'            => $commande->date_annulation,
            'raison_annulation'          => $commande->raison_annulation,
            'client'                     => $commande->client ? [
                'id'    => $commande->client->id,
                'nom'   => $commande->client->nom,
                'prenom'=> $commande->client->prenom,
                'email' => $commande->client->email,
            ] : null,
            'utilisateur_enregistre'     => $commande->utilisateurEnregistre ? [
                'id'    => $commande->utilisateurEnregistre->id,
                'nom'   => $commande->utilisateurEnregistre->name,
                'prenom'=> $commande->utilisateurEnregistre->prename,
            ] : null,
            'utilisateur_valide'         => $commande->utilisateurValide ? [
                'id'    => $commande->utilisateurValide->id,
                'nom'   => $commande->utilisateurValide->name,
                'prenom'=> $commande->utilisateurValide->prename,
            ] : null,
            'stock_reserve'              => (float) $stockReserve,
            'etat_metier'                => $this->etatMetierCommande($commande),
            'lignes'                     => $withLines ? $commande->lignes->map(fn($ligne) => [
                'commande_id'   => $ligne->commande_id,
                'produit_id'    => $ligne->produit_id,
                'quantite'      => (float) $ligne->quantite,
                'prix_unitaire' => (float) $ligne->prix_unitaire,
                'reduction'     => (float) $ligne->reduction,
                'montant'       => (float) $ligne->montant,
            ])->values() : null,
        ];
    }

    private function livraisonPayload(Livraison $livraison): array
    {
        return [
            'id'                        => $livraison->id,
            'date_creation'             => $livraison->date_creation,
            'date_livraison_effective'  => $livraison->date_livraison_effective,
            'statut'                    => $livraison->statut,
            'motif_echec'               => $livraison->motif_echec,
            'motif_retour'              => $livraison->motif_retour,
            'date_lancement'            => $livraison->date_lancement,
            'date_annulation'           => $livraison->date_annulation,
            'raison_annulation'         => $livraison->raison_annulation,
            'commande'                  => $livraison->commande,
            'livreur'                   => $livraison->livreur,
        ];
    }

    private function etatMetierCommande(Commande $commande): string
    {
        if ($commande->statut === 'brouillon') {
            return 'reçue';
        }

        if ($commande->statut === 'annulee') {
            return 'annulée';
        }

        if ($commande->livraisons->contains(fn(Livraison $livraison) => $livraison->statut === 'livree')) {
            return 'livrée';
        }

        if ($commande->livraisons->contains(fn(Livraison $livraison) => $livraison->statut === 'en_cours')) {
            return 'en cours de livraison';
        }

        return 'validée';
    }
}
