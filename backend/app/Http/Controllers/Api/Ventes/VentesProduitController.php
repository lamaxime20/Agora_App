<?php

namespace App\Http\Controllers\Api\Ventes;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentesProduitController extends VentesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 10 — GET /api/ventes/produits
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste des produits actifs de l'entreprise avec stock disponible calculé.
     *
     * Query params : recherche
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $recherche = trim((string) $request->query('recherche', ''));

            $query = DB::table('produits as p')
                ->join('categories_produit as cat', 'cat.id', '=', 'p.categorie')
                ->where('p.entreprise', $entrepriseId)
                ->where('p.statut', 'actif');

            if ($recherche !== '') {
                $query->where('p.nom', 'ilike', '%' . $recherche . '%');
            }

            $data = $query
                ->orderBy('p.nom', 'asc')
                ->select([
                    'p.id',
                    'p.nom',
                    'p.prix_unitaire',
                    'p.type_produit',
                    'p.stock_actuel',
                    'p.seuil_alerte',
                    'p.unite_mesure',
                    'cat.categorie',
                    $this->stockReserveRaw($entrepriseId),
                ])
                ->get()
                ->map(function ($row) {
                    $stockReserve    = ($row->type_produit === 'physique') ? (float) $row->stock_reserve : null;
                    $stockDisponible = ($row->type_produit === 'physique')
                        ? max(0, (float) $row->stock_actuel - (float) $row->stock_reserve)
                        : null;

                    return [
                        'id'              => $row->id,
                        'nom'             => $row->nom,
                        'prix_unitaire'   => (float) $row->prix_unitaire,
                        'reduction'       => 0,
                        'type_produit'    => $row->type_produit,
                        'stock_actuel'    => $row->type_produit === 'physique' ? (float) $row->stock_actuel : null,
                        'stock_reserve'   => $stockReserve,
                        'stock_disponible'=> $stockDisponible,
                        'seuil_alerte'    => (float) $row->seuil_alerte,
                        'unite_mesure'    => $row->unite_mesure,
                        'categorie'       => $row->categorie,
                    ];
                });

            return response()->json(['data' => $data], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }
}
