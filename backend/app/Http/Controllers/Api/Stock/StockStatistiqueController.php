<?php

namespace App\Http\Controllers\Api\Stock;

use App\Models\CategorieProduit;
use App\Models\Historique;
use App\Models\PerteProduit;
use App\Models\Produit;
use App\Models\Ravitaillement;
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

        $produitsActifs = Produit::where('entreprise', $entreprise->id)->where('statut', 'actif')->count();
        $categoriesCount = CategorieProduit::where('entreprise', $entreprise->id)->count();
        $valeurStockRow = DB::table('produits')
            ->where('entreprise', $entreprise->id)
            ->where('statut', 'actif')
            ->selectRaw('COALESCE(SUM(stock_actuel * prix_unitaire), 0) as total')
            ->first();
        $valeurStock = (float) ($valeurStockRow->total ?? 0);

        $ruptures = Produit::where('entreprise', $entreprise->id)
            ->where('statut', 'actif')
            ->where('stock_actuel', '<=', 0)
            ->count();

        $stocksFaibles = Produit::where('entreprise', $entreprise->id)
            ->where('statut', 'actif')
            ->whereColumn('stock_actuel', '<=', 'seuil_alerte')
            ->where('stock_actuel', '>', 0)
            ->count();

        $pertesRow = DB::table('pertes_produits as pp')
            ->join('produits as p', 'p.id', '=', 'pp.produit')
            ->where('pp.entreprise', $entreprise->id)
            ->when($dateDebut, fn($query) => $query->where('date_perte', '>=', $dateDebut))
            ->when($dateFin, fn($query) => $query->where('date_perte', '<=', $dateFin))
            ->selectRaw('COALESCE(SUM(pp.quantite_perdu * p.prix_unitaire), 0) as total')
            ->first();
        $pertes = (float) ($pertesRow->total ?? 0);

        $evolutionStock = Historique::where('module', 'stock')
            ->where('entreprise', $entreprise->id)
            ->when($dateDebut, fn($query) => $query->where('date_action', '>=', $dateDebut))
            ->when($dateFin, fn($query) => $query->where('date_action', '<=', $dateFin))
            ->orderBy('date_action')
            ->limit(30)
            ->get()
            ->map(fn(Historique $historique) => [
                'date_action' => $historique->date_action,
                'table'       => $historique->table_concernee,
                'action'      => $historique->action,
                'ancienne'    => $historique->ancienne_valeur,
                'nouvelle'    => $historique->nouvelle_valeur,
            ])
            ->values();

        $evolutionPertes = PerteProduit::where('entreprise', $entreprise->id)
            ->when($dateDebut, fn($query) => $query->where('date_perte', '>=', $dateDebut))
            ->when($dateFin, fn($query) => $query->where('date_perte', '<=', $dateFin))
            ->selectRaw('DATE(date_perte) as date, COALESCE(SUM(quantite_perdu), 0) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $evolutionRavitaillements = Ravitaillement::where('entreprise', $entreprise->id)
            ->when($dateDebut, fn($query) => $query->where('date_creation', '>=', $dateDebut))
            ->when($dateFin, fn($query) => $query->where('date_creation', '<=', $dateFin))
            ->selectRaw('DATE(date_creation) as date, COUNT(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

            return response()->json([
            'data' => [
                'kpis' => [
                    'produits_actifs'        => $produitsActifs,
                    'categories'             => $categoriesCount,
                    'valeur_stock'           => $valeurStock,
                    'ruptures_stock'         => $ruptures,
                    'stocks_faibles'         => $stocksFaibles,
                    'valeur_pertes'          => (float) $pertes,
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
        $produits = Produit::where('entreprise', $entreprise->id)
            ->where('statut', 'actif')
            ->with('categorie')
            ->orderByDesc('date_creation')
            ->limit(20)
            ->get()
            ->map(function (Produit $produit) {
                $ventes = DB::table('contenir_produit as cp')
                    ->join('commandes as c', 'c.id', '=', 'cp.commande_id')
                    ->where('cp.produit_id', $produit->id)
                    ->where('c.statut', 'validee')
                    ->selectRaw('COALESCE(COUNT(DISTINCT cp.commande_id), 0) as nb_commandes, COALESCE(SUM(cp.quantite), 0) as quantite, COALESCE(SUM(cp.montant), 0) as ca')
                    ->first();

                return [
                    'id'                  => $produit->id,
                    'nom'                 => $produit->nom,
                    'categorie'           => $produit->categorie?->categorie,
                    'type_produit'        => $produit->type_produit,
                    'stock_actuel'        => (float) $produit->stock_actuel,
                    'prix_unitaire'       => (float) $produit->prix_unitaire,
                    'nb_ventes'           => (int) ($ventes->nb_commandes ?? 0),
                    'quantite_vendue'     => (float) ($ventes->quantite ?? 0),
                    'ca_total'            => (float) ($ventes->ca ?? 0),
                ];
            });

            return response()->json([
            'data' => [
                'kpis' => [
                    'total_produits' => Produit::where('entreprise', $entreprise->id)->where('statut', 'actif')->count(),
                ],
                'produits' => $produits,
            ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'produits']);
        }
    }

    public function stock(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);
        $reservedMap = $this->reservedQuantitiesByProduct($entreprise->id);

        $produits = Produit::with('categorie')
            ->where('entreprise', $entreprise->id)
            ->where('statut', 'actif')
            ->orderBy('nom')
            ->get()
            ->map(function (Produit $produit) use ($reservedMap) {
                $stockDisponible = $this->stockDisponible($produit, $reservedMap);

                return [
                    'id'               => $produit->id,
                    'nom'              => $produit->nom,
                    'categorie'        => $produit->categorie?->categorie,
                    'stock_actuel'     => (float) $produit->stock_actuel,
                    'stock_reserve'    => (float) ($reservedMap[$produit->id] ?? 0),
                    'stock_disponible' => $stockDisponible,
                    'seuil_alerte'     => (float) $produit->seuil_alerte,
                    'statut'           => $this->availabilityLabel($produit, $stockDisponible),
                ];
            });

            return response()->json([
            'data' => [
                'produits' => $produits,
            ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'stock']);
        }
    }

    public function ravitaillements(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);
        $ravitaillements = Ravitaillement::where('entreprise', $entreprise->id)
            ->selectRaw('statut, COUNT(*) as total, COALESCE(SUM(montant_a_depenser), 0) as montant_total, COALESCE(SUM(quantite), 0) as quantite_total')
            ->groupBy('statut')
            ->orderBy('statut')
            ->get();

        $timeline = Ravitaillement::where('entreprise', $entreprise->id)
            ->selectRaw('DATE(date_creation) as date, COUNT(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

            return response()->json([
            'data' => [
                'kpis' => [
                    'total' => Ravitaillement::where('entreprise', $entreprise->id)->count(),
                ],
                'statuts' => $ravitaillements,
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
        $pertes = PerteProduit::where('entreprise', $entreprise->id)
            ->selectRaw('COUNT(*) as total_pertes, COALESCE(SUM(quantite_perdu), 0) as quantite_totale')
            ->first();

        $evolution = PerteProduit::where('entreprise', $entreprise->id)
            ->selectRaw('DATE(date_perte) as date, COALESCE(SUM(quantite_perdu), 0) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

            return response()->json([
            'data' => [
                'kpis' => [
                    'total_pertes'     => (int) ($pertes->total_pertes ?? 0),
                    'quantite_totale'  => (float) ($pertes->quantite_totale ?? 0),
                ],
                'evolution' => $evolution,
            ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'pertes']);
        }
    }
}
