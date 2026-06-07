<?php

namespace App\Http\Controllers\Api\Stock;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockStatistiqueController extends StockBaseController
{
    public function vueGenerale(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);
            [$dateDebut, $dateFin] = $this->daterange($request->query('dateDebut'), $request->query('dateFin'));

            $produitsActifs = DB::table('produits')
                ->where('entreprise', $entreprise->id)
                ->where('statut', 'actif')
                ->count();

            $categoriesCount = DB::table('categories_produit')
                ->where('entreprise', $entreprise->id)
                ->count();

            $valeurStockRow = DB::table('produits')
                ->where('entreprise', $entreprise->id)
                ->where('statut', 'actif')
                ->selectRaw('COALESCE(SUM(stock_actuel * prix_unitaire), 0) as total')
                ->first();
            $valeurStock = (float) ($valeurStockRow->total ?? 0);

            $ruptures = DB::table('produits')
                ->where('entreprise', $entreprise->id)
                ->where('statut', 'actif')
                ->where('stock_actuel', '<=', 0)
                ->count();

            $stocksFaibles = DB::table('produits')
                ->where('entreprise', $entreprise->id)
                ->where('statut', 'actif')
                ->whereColumn('stock_actuel', '<=', 'seuil_alerte')
                ->where('stock_actuel', '>', 0)
                ->count();

            $pertesRow = DB::table('pertes_produits as pp')
                ->join('produits as p', 'p.id', '=', 'pp.produit')
                ->where('pp.entreprise', $entreprise->id)
                ->when($dateDebut, fn($query) => $query->where('pp.date_perte', '>=', $dateDebut))
                ->when($dateFin,   fn($query) => $query->where('pp.date_perte', '<=', $dateFin))
                ->selectRaw('COALESCE(SUM(pp.quantite_perdu * p.prix_unitaire), 0) as total')
                ->first();
            $pertes = (float) ($pertesRow->total ?? 0);

            $evolutionStock = DB::table('historiques')
                ->where('module', 'stock')
                ->where('entreprise', $entreprise->id)
                ->when($dateDebut, fn($query) => $query->where('date_action', '>=', $dateDebut))
                ->when($dateFin,   fn($query) => $query->where('date_action', '<=', $dateFin))
                ->orderBy('date_action')
                ->limit(30)
                ->select(['date_action', 'table_concernee', 'action', 'ancienne_valeur', 'nouvelle_valeur'])
                ->get()
                ->map(fn($row) => [
                    'date_action' => $row->date_action,
                    'table'       => $row->table_concernee,
                    'action'      => $row->action,
                    'ancienne'    => $row->ancienne_valeur,
                    'nouvelle'    => $row->nouvelle_valeur,
                ])
                ->values();

            $evolutionPertes = DB::table('pertes_produits')
                ->where('entreprise', $entreprise->id)
                ->when($dateDebut, fn($query) => $query->where('date_perte', '>=', $dateDebut))
                ->when($dateFin,   fn($query) => $query->where('date_perte', '<=', $dateFin))
                ->selectRaw('DATE(date_perte) as date, COALESCE(SUM(quantite_perdu), 0) as total')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $evolutionRavitaillements = DB::table('ravitaillements')
                ->where('entreprise', $entreprise->id)
                ->when($dateDebut, fn($query) => $query->where('date_creation', '>=', $dateDebut))
                ->when($dateFin,   fn($query) => $query->where('date_creation', '<=', $dateFin))
                ->selectRaw('DATE(date_creation) as date, COUNT(*) as total')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'data' => [
                    'kpis' => [
                        'produits_actifs' => $produitsActifs,
                        'categories'      => $categoriesCount,
                        'valeur_stock'    => $valeurStock,
                        'ruptures_stock'  => $ruptures,
                        'stocks_faibles'  => $stocksFaibles,
                        'valeur_pertes'   => $pertes,
                    ],
                    'evolution_valeur_stock'    => $evolutionStock,
                    'evolution_pertes'          => $evolutionPertes,
                    'evolution_ravitaillements' => $evolutionRavitaillements,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'vueGenerale']);
        }
    }

    public function produits(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);

            $produits = DB::table('produits as p')
                ->leftJoin('categories_produit as cp', 'cp.id', '=', 'p.categorie')
                ->where('p.entreprise', $entreprise->id)
                ->where('p.statut', 'actif')
                ->orderByDesc('p.date_creation')
                ->limit(20)
                ->select([
                    'p.id', 'p.nom', 'p.type_produit', 'p.stock_actuel', 'p.prix_unitaire',
                    'cp.categorie as categorie_nom',
                ])
                ->get();

            $produitIds = $produits->pluck('id')->all();

            $ventesMap = collect();
            if (!empty($produitIds)) {
                $ventesMap = DB::table('contenir_produit as cp')
                    ->join('commandes as c', 'c.id', '=', 'cp.commande_id')
                    ->whereIn('cp.produit_id', $produitIds)
                    ->where('c.statut', 'validee')
                    ->groupBy('cp.produit_id')
                    ->select([
                        'cp.produit_id',
                        DB::raw('COALESCE(COUNT(DISTINCT cp.commande_id), 0) as nb_commandes'),
                        DB::raw('COALESCE(SUM(cp.quantite), 0) as quantite'),
                        DB::raw('COALESCE(SUM(cp.montant), 0) as ca'),
                    ])
                    ->get()
                    ->keyBy('produit_id');
            }

            $mapped = $produits->map(fn($row) => [
                'id'             => $row->id,
                'nom'            => $row->nom,
                'categorie'      => $row->categorie_nom,
                'type_produit'   => $row->type_produit,
                'stock_actuel'   => (float) $row->stock_actuel,
                'prix_unitaire'  => (float) $row->prix_unitaire,
                'nb_ventes'      => (int) ($ventesMap->get($row->id)?->nb_commandes ?? 0),
                'quantite_vendue'=> (float) ($ventesMap->get($row->id)?->quantite ?? 0),
                'ca_total'       => (float) ($ventesMap->get($row->id)?->ca ?? 0),
            ]);

            $totalProduits = DB::table('produits')
                ->where('entreprise', $entreprise->id)
                ->where('statut', 'actif')
                ->count();

            return response()->json([
                'data' => [
                    'kpis'    => ['total_produits' => $totalProduits],
                    'produits' => $mapped,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'produits']);
        }
    }

    public function stock(Request $request): JsonResponse
    {
        try {
            $entreprise  = $this->currentEntreprise($request);
            $reservedMap = $this->reservedQuantitiesByProduct($entreprise->id);

            $produits = DB::table('produits as p')
                ->leftJoin('categories_produit as cp', 'cp.id', '=', 'p.categorie')
                ->where('p.entreprise', $entreprise->id)
                ->where('p.statut', 'actif')
                ->orderBy('p.nom')
                ->select([
                    'p.id', 'p.nom', 'p.type_produit', 'p.stock_actuel', 'p.seuil_alerte',
                    'cp.categorie as categorie_nom',
                ])
                ->get()
                ->map(function ($row) use ($reservedMap) {
                    $stockDisponible = $this->stockDisponible($row, $reservedMap);

                    return [
                        'id'               => $row->id,
                        'nom'              => $row->nom,
                        'categorie'        => $row->categorie_nom,
                        'stock_actuel'     => (float) $row->stock_actuel,
                        'stock_reserve'    => (float) ($reservedMap[$row->id] ?? 0),
                        'stock_disponible' => $stockDisponible,
                        'seuil_alerte'     => (float) $row->seuil_alerte,
                        'statut'           => $this->availabilityLabel($row, $stockDisponible),
                    ];
                });

            return response()->json([
                'data' => ['produits' => $produits],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'stock']);
        }
    }

    public function ravitaillements(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);

            $statuts = DB::table('ravitaillements')
                ->where('entreprise', $entreprise->id)
                ->selectRaw('statut, COUNT(*) as total, COALESCE(SUM(montant_a_depenser), 0) as montant_total, COALESCE(SUM(quantite), 0) as quantite_total')
                ->groupBy('statut')
                ->orderBy('statut')
                ->get();

            $timeline = DB::table('ravitaillements')
                ->where('entreprise', $entreprise->id)
                ->selectRaw('DATE(date_creation) as date, COUNT(*) as total')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $total = DB::table('ravitaillements')
                ->where('entreprise', $entreprise->id)
                ->count();

            return response()->json([
                'data' => [
                    'kpis'     => ['total' => $total],
                    'statuts'  => $statuts,
                    'timeline' => $timeline,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'ravitaillements']);
        }
    }

    public function pertes(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);

            $pertes = DB::table('pertes_produits')
                ->where('entreprise', $entreprise->id)
                ->selectRaw('COUNT(*) as total_pertes, COALESCE(SUM(quantite_perdu), 0) as quantite_totale')
                ->first();

            $evolution = DB::table('pertes_produits')
                ->where('entreprise', $entreprise->id)
                ->selectRaw('DATE(date_perte) as date, COALESCE(SUM(quantite_perdu), 0) as total')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'data' => [
                    'kpis' => [
                        'total_pertes'    => (int) ($pertes->total_pertes ?? 0),
                        'quantite_totale' => (float) ($pertes->quantite_totale ?? 0),
                    ],
                    'evolution' => $evolution,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'pertes']);
        }
    }
}
