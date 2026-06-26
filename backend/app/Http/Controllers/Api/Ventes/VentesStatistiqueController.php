<?php

namespace App\Http\Controllers\Api\Ventes;

use App\Services\ExportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VentesStatistiqueController extends VentesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 14 — GET /api/ventes/statistiques/general
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * KPIs généraux : clients, commandes, produits, CA, livraisons, stocks.
     *
     * Query params : date_debut, date_fin
     */
    public function general(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            // Requête de base pour les commandes sur la période
            $commandesQuery = DB::table('commandes as c')
                ->where('c.entreprise', $entrepriseId)
                ->where('c.actif', true);

            if ($from) {
                $commandesQuery->where('c.date_commande', '>=', $from);
            }
            if ($to) {
                $commandesQuery->where('c.date_commande', '<=', $to);
            }

            $nbClients   = (clone $commandesQuery)->distinct('c.client')->count('c.client');
            $nbCommandes = (clone $commandesQuery)->count();

            $payementsQuery = DB::table('payements as p')
                ->join('commandes as c', 'c.id', '=', 'p.commande')
                ->where('p.entreprise', $entrepriseId)
                ->where('p.actif', true);

            if ($from) {
                $payementsQuery->where('p.date_payement', '>=', $from);
            }
            if ($to) {
                $payementsQuery->where('p.date_payement', '<=', $to);
            }

            $caTotal = (float) (clone $payementsQuery)->sum('p.montant');

            $nbProduits = DB::table('produits')
                ->where('entreprise', $entrepriseId)
                ->where('statut', 'actif')
                ->count();

            // Commandes par statut métier (sur la période)
            $commandesEnLivraison = (clone $commandesQuery)
                ->where('c.statut', 'validee')
                ->whereExists(function ($q) {
                    $q->selectRaw('1')->from('livraisons as lf')
                      ->whereRaw('lf.commande = c.id')
                      ->where('lf.statut', 'en_cours');
                })
                ->count();

            $commandesLivrees = (clone $commandesQuery)
                ->where('c.statut', 'validee')
                ->whereExists(function ($q) {
                    $q->selectRaw('1')->from('livraisons as lf')
                      ->whereRaw('lf.commande = c.id')
                      ->where('lf.statut', 'livree');
                })
                ->count();

            $commandesAnnulees = (clone $commandesQuery)
                ->where('c.statut', 'annulee')
                ->count();

            $denomTaux = $commandesLivrees + $commandesAnnulees;
            $tauxLivraison = $denomTaux > 0
                ? round(($commandesLivrees / $denomTaux) * 100, 1)
                : 0;

            // Produits physiques actifs : rupture et stock faible
            $produitsPhysiques = DB::table('produits as p')
                ->where('p.entreprise', $entrepriseId)
                ->where('p.statut', 'actif')
                ->where('p.type_produit', 'physique')
                ->select([
                    'p.id',
                    'p.stock_actuel',
                    'p.seuil_alerte',
                    $this->stockReserveRaw($entrepriseId),
                ])
                ->get();

            $produitsRupture    = 0;
            $produitsStockFaible = 0;

            foreach ($produitsPhysiques as $p) {
                $dispo = max(0, (float) $p->stock_actuel - (float) $p->stock_reserve);
                if ($dispo === 0.0) {
                    $produitsRupture++;
                } elseif ($dispo <= (float) $p->seuil_alerte) {
                    $produitsStockFaible++;
                }
            }

            return response()->json([
                'kpis' => [
                    'nb_clients'  => $nbClients,
                    'nb_commandes'=> $nbCommandes,
                    'nb_produits' => $nbProduits,
                    'ca_total'    => $caTotal,
                ],
                'commandes_en_livraison'=> $commandesEnLivraison,
                'commandes_livrees'     => $commandesLivrees,
                'commandes_annulees'    => $commandesAnnulees,
                'taux_livraison'        => $tauxLivraison,
                'produits_rupture'      => $produitsRupture,
                'produits_stock_faible' => $produitsStockFaible,
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 15 — GET /api/ventes/statistiques/clients
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Classement des clients par CA : top et moins actifs.
     *
     * Query params : date_debut, date_fin, limit (défaut 5)
     */
    public function clients(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $limit = max(1, min(50, (int) $request->query('limit', 5)));

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            // Nombre de commandes par client sur la période (filtre date_commande)
            $commandesQuery = DB::table('commandes as c')
                ->where('c.entreprise', $entrepriseId);
            if ($from) {
                $commandesQuery->where('c.date_commande', '>=', $from);
            }
            if ($to) {
                $commandesQuery->where('c.date_commande', '<=', $to);
            }
            $commandesParClient = $commandesQuery
                ->groupBy('c.client')
                ->select(['c.client', DB::raw('COUNT(c.id) as nb_commandes')])
                ->pluck('nb_commandes', 'client');

            // CA par client sur la période (filtre date_payement)
            $caQuery = DB::table('payements as p')
                ->join('commandes as c', 'c.id', '=', 'p.commande')
                ->where('p.entreprise', $entrepriseId)
                ->where('p.actif', true);
            if ($from) {
                $caQuery->where('p.date_payement', '>=', $from);
            }
            if ($to) {
                $caQuery->where('p.date_payement', '<=', $to);
            }
            $caParClient = $caQuery
                ->groupBy('c.client')
                ->select(['c.client', DB::raw('SUM(p.montant) as ca')])
                ->pluck('ca', 'client');

            // Tous les clients de l'entreprise
            $tousClients = DB::table('clients as cl')
                ->where('cl.entreprise', $entrepriseId)
                ->select(['cl.id', DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as nom_complet")])
                ->get()
                ->map(fn($row) => [
                    'id'        => $row->id,
                    'nom'       => $row->nom_complet,
                    'commandes' => (int) ($commandesParClient[$row->id] ?? 0),
                    'ca'        => (float) ($caParClient[$row->id] ?? 0),
                ])
                ->sortByDesc('ca')
                ->values();

            // Top clients (ca DESC)
            $topClients = $tousClients
                ->take($limit)
                ->values()
                ->map(fn($row, $idx) => array_merge(['rang' => $idx + 1], $row));

            // Clients moins actifs parmi ceux ayant au moins 1 commande (ca ASC)
            $actifs = $tousClients->filter(fn($row) => $row['commandes'] > 0)->sortBy('ca')->values();
            $clientsMoinsActifs = $actifs
                ->take($limit)
                ->values()
                ->map(fn($row, $idx) => array_merge(['rang' => $idx + 1], $row));

            $caMax = $tousClients->max('ca') ?? 0;

            return response()->json([
                'top_clients'         => $topClients,
                'clients_moins_actifs'=> $clientsMoinsActifs,
                'ca_max'              => (float) $caMax,
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 16 — GET /api/ventes/statistiques/commandes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Statistiques des commandes : produits fréquents et commandes par montant.
     *
     * Query params : date_debut, date_fin, limit (défaut 5)
     */
    public function commandes(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $limit = max(1, min(50, (int) $request->query('limit', 5)));

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            // Base query sur contenir_produit avec filtre de période
            $cpQuery = DB::table('contenir_produit as cp')
                ->join('commandes as c', 'c.id', '=', 'cp.commande_id')
                ->join('produits as p', 'p.id', '=', 'cp.produit_id')
                ->where('c.entreprise', $entrepriseId);

            if ($from) {
                $cpQuery->where('c.date_commande', '>=', $from);
            }
            if ($to) {
                $cpQuery->where('c.date_commande', '<=', $to);
            }

            // Produits groupés par fréquence d'apparition
            $produitsGroupes = (clone $cpQuery)
                ->groupBy('cp.produit_id', 'p.nom')
                ->select([
                    'cp.produit_id as id',
                    'p.nom as produit',
                    DB::raw('COUNT(cp.commande_id) as nb_commandes'),
                    DB::raw('SUM(cp.montant) as montant_total'),
                ])
                ->orderByDesc('nb_commandes')
                ->get();

            $plusFrequentes = $produitsGroupes->take($limit)->values()
                ->map(fn($row, $idx) => [
                    'rang'         => $idx + 1,
                    'id'           => $row->id,
                    'produit'      => $row->produit,
                    'commandes'    => (int) $row->nb_commandes,
                    'montant_total'=> (float) $row->montant_total,
                ]);

            $moinsFrequentes = $produitsGroupes->sortBy('nb_commandes')->values()->take($limit)->values()
                ->map(fn($row, $idx) => [
                    'rang'         => $idx + 1,
                    'id'           => $row->id,
                    'produit'      => $row->produit,
                    'commandes'    => (int) $row->nb_commandes,
                    'montant_total'=> (float) $row->montant_total,
                ]);

            // Commandes par montant
            $commandesQuery = DB::table('commandes as c')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.entreprise', $entrepriseId)
                ->where('c.actif', true);

            if ($from) {
                $commandesQuery->where('c.date_commande', '>=', $from);
            }
            if ($to) {
                $commandesQuery->where('c.date_commande', '<=', $to);
            }

            $toutesCommandes = (clone $commandesQuery)
                ->select([
                    'c.id',
                    'c.montant_commande',
                    'c.date_commande',
                    'c.entreprise',
                    $this->numeroCommandeRaw(),
                    DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client"),
                ])
                ->orderByDesc('c.montant_commande')
                ->get();

            $plusGrossMontants = $toutesCommandes->take($limit)->values()
                ->map(fn($row, $idx) => [
                    'rang'   => $idx + 1,
                    'id'     => $row->id,
                    'numero' => $row->numero,
                    'montant'=> (float) $row->montant_commande,
                    'client' => $row->client,
                ]);

            $plusFaiblesMontants = $toutesCommandes->sortBy('montant_commande')->values()->take($limit)->values()
                ->map(fn($row, $idx) => [
                    'rang'   => $idx + 1,
                    'id'     => $row->id,
                    'numero' => $row->numero,
                    'montant'=> (float) $row->montant_commande,
                    'client' => $row->client,
                ]);

            $montantMax = $toutesCommandes->max('montant_commande') ?? 0;

            return response()->json([
                'plus_frequentes'     => $plusFrequentes,
                'moins_frequentes'    => $moinsFrequentes,
                'plus_gros_montants'  => $plusGrossMontants,
                'plus_faibles_montants'=> $plusFaiblesMontants,
                'montant_max'         => (float) $montantMax,
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }

    public function export(Request $request): Response|StreamedResponse
    {
        $entreprise   = $this->currentEntreprise($request);
        $format       = strtolower($request->query('format', 'pdf'));
        [$from, $to]  = $this->daterange($request->query('date_debut'), $request->query('date_fin'));

        $rows    = $this->buildStatistiquesExportRows($entreprise->id, $from, $to);
        $columns = [
            'indicateur' => 'Indicateur',
            'valeur'     => 'Valeur',
        ];
        $subtitle = ($from && $to)
            ? 'Du ' . $from->toDateString() . ' au ' . $to->toDateString()
            : 'Toutes les périodes';
        $filename = 'agora-ventes-statistiques-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => ExportService::csv($rows, $columns, $filename),
            'docx'        => ExportService::docx($rows, $columns, 'Statistiques des Ventes', $subtitle, $filename),
            default       => ExportService::pdf($rows, $columns, 'Statistiques des Ventes', $subtitle, $filename),
        };
    }

    private function buildStatistiquesExportRows(string $entrepriseId, ?Carbon $from, ?Carbon $to): array
    {
        $commandesQuery = DB::table('commandes as c')
            ->where('c.entreprise', $entrepriseId)
            ->where('c.actif', true);
        if ($from) {
            $commandesQuery->where('c.date_commande', '>=', $from);
        }
        if ($to) {
            $commandesQuery->where('c.date_commande', '<=', $to);
        }

        $nbClients   = (clone $commandesQuery)->distinct('c.client')->count('c.client');
        $nbCommandes = (clone $commandesQuery)->count();
        $nbAnnulees  = (clone $commandesQuery)->where('c.statut', 'annulee')->count();
        $nbLivrees   = (clone $commandesQuery)
            ->where('c.statut', 'validee')
            ->whereExists(fn($q) => $q->selectRaw('1')->from('livraisons as lf')
                ->whereRaw('lf.commande = c.id')->where('lf.statut', 'livree'))
            ->count();

        $payementsQuery = DB::table('payements as p')
            ->join('commandes as c', 'c.id', '=', 'p.commande')
            ->where('p.entreprise', $entrepriseId)
            ->where('p.actif', true);
        if ($from) {
            $payementsQuery->where('p.date_payement', '>=', $from);
        }
        if ($to) {
            $payementsQuery->where('p.date_payement', '<=', $to);
        }
        $caTotal = (float) (clone $payementsQuery)->sum('p.montant');

        $denom        = $nbLivrees + $nbAnnulees;
        $tauxLivraison = $denom > 0 ? round(($nbLivrees / $denom) * 100, 1) : 0;

        $nbProduits = DB::table('produits')
            ->where('entreprise', $entrepriseId)
            ->where('statut', 'actif')
            ->count();

        $panier = $nbCommandes > 0 ? round($caTotal / $nbCommandes, 2) : 0;

        return [
            ['indicateur' => 'Clients ayant commandé', 'valeur' => $nbClients],
            ['indicateur' => 'Commandes totales',       'valeur' => $nbCommandes],
            ['indicateur' => 'Commandes livrées',       'valeur' => $nbLivrees],
            ['indicateur' => 'Commandes annulées',      'valeur' => $nbAnnulees],
            ['indicateur' => 'Taux de livraison',       'valeur' => $tauxLivraison . ' %'],
            ['indicateur' => 'Chiffre d\'affaires',     'valeur' => ExportService::fmtMontant($caTotal)],
            ['indicateur' => 'Panier moyen',            'valeur' => ExportService::fmtMontant($panier)],
            ['indicateur' => 'Produits actifs',         'valeur' => $nbProduits],
        ];
    }
}
