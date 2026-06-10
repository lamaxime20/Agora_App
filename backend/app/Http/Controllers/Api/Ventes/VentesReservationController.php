<?php

namespace App\Http\Controllers\Api\Ventes;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentesReservationController extends VentesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 11 — GET /api/ventes/reservations
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des réservations (lignes contenir_produit) avec statut calculé.
     *
     * Query params : page, per_page, recherche, statut, produit, client,
     *                date_debut, date_fin
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche = trim((string) $request->query('recherche', ''));
            $statut    = $request->query('statut', 'tous');
            $produit   = trim((string) $request->query('produit', ''));
            $client    = trim((string) $request->query('client', ''));
            $dateDebut = $request->query('date_debut');
            $dateFin   = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('contenir_produit as cp')
                ->join('commandes as c', 'c.id', '=', 'cp.commande_id')
                ->join('produits as p', 'p.id', '=', 'cp.produit_id')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.entreprise', $entrepriseId)
                ->where('p.type_produit', 'physique');

            if ($statut !== 'tous') {
                match ($statut) {
                    'annulé'   => $query->where('c.statut', 'annulee'),
                    'validé'   => $query->whereExists(function ($q) {
                        $q->selectRaw('1')->from('livraisons as lf')
                          ->whereRaw('lf.commande = c.id')
                          ->where('lf.statut', 'livree');
                    }),
                    'en_cours' => $query->where('c.statut', '!=', 'annulee')
                                       ->whereNotExists(function ($q) {
                                           $q->selectRaw('1')->from('livraisons as lf')
                                             ->whereRaw('lf.commande = c.id')
                                             ->where('lf.statut', 'livree');
                                       }),
                    default    => null,
                };
            }

            if ($recherche !== '') {
                $query->where(function ($q) use ($recherche) {
                    $q->where('p.nom', 'ilike', '%' . $recherche . '%')
                        ->orWhere(DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, ''))"), 'ilike', '%' . $recherche . '%')
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

            if ($produit !== '') {
                $query->where('p.nom', 'ilike', '%' . $produit . '%');
            }
            if ($client !== '') {
                $query->where(function ($q) use ($client) {
                    $q->where('cl.nom', 'ilike', '%' . $client . '%')
                        ->orWhere('cl.prenom', 'ilike', '%' . $client . '%');
                });
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
                    'cp.commande_id',
                    'cp.produit_id',
                    'cp.quantite',
                    'c.statut as commande_statut',
                    'c.date_commande',
                    'p.nom as produit_nom',
                    'p.type_produit',
                    'p.stock_actuel',
                    DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client"),
                    $this->numeroCommandeRaw(),
                    DB::raw("(SELECT COUNT(1) FROM livraisons lv WHERE lv.commande = c.id AND lv.statut = 'livree') > 0 as a_livraison_livree"),
                    $this->stockReserveRaw($entrepriseId),
                ])
                ->get()
                ->map(function ($row) {
                    $statutReservation = $this->calculerStatutReservation(
                        $row->commande_statut,
                        (bool) $row->a_livraison_livree
                    );

                    $stockReserve    = $row->type_produit === 'physique' ? (float) $row->stock_reserve : null;
                    $stockDisponible = $row->type_produit === 'physique'
                        ? max(0, (float) $row->stock_actuel - (float) $row->stock_reserve)
                        : null;
                    $stockReserve    = (float) $row->stock_reserve;
                    $stockDisponible = max(0, (float) $row->stock_actuel - $stockReserve);

                    return [
                        'id'              => $row->commande_id . '_' . $row->produit_id,
                        'produit_nom'     => $row->produit_nom,
                        'quantite'        => (float) $row->quantite,
                        'client'          => $row->client,
                        'commande_numero' => $row->numero,
                        'statut'          => $statutReservation,
                        'date'            => substr($row->date_commande, 0, 10),
                        'stock_actuel'    => $row->type_produit === 'physique' ? (float) $row->stock_actuel : null,
                        'stock_actuel'    => (float) $row->stock_actuel,
                        'stock_reserve'   => $stockReserve,
                        'stock_disponible'=> $stockDisponible,
                    ];
                });

            return response()->json([
                'data' => $data,
                'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total],
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 12 — GET /api/ventes/reservations/{commande_id}/{produit_id}
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Détail d'une réservation (ligne contenir_produit) spécifique.
     */
    public function show(Request $request, string $commandeId, string $produitId): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $commandeExists = DB::table('commandes')
                ->where('id', $commandeId)
                ->where('entreprise', $entrepriseId)
                ->exists();

            if (!$commandeExists) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Commande introuvable.',
                ], 404);
            }

            $cp = DB::table('contenir_produit')
                ->where('commande_id', $commandeId)
                ->where('produit_id', $produitId)
                ->first();

            if (!$cp) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Réservation introuvable.',
                ], 404);
            }

            $produit = DB::table('produits as p')
                ->where('p.id', $produitId)
                ->select([
                    'p.id', 'p.nom', 'p.stock_actuel', 'p.type_produit',
                    $this->stockReserveRaw($entrepriseId),
                ])
                ->first();

            $commande = DB::table('commandes as c')
                ->where('c.id', $commandeId)
                ->select([
                    'c.id', 'c.statut', 'c.date_commande',
                    $this->numeroCommandeRaw(),
                    DB::raw("(SELECT COUNT(1) FROM livraisons lv WHERE lv.commande = c.id AND lv.statut = 'livree') > 0 as a_livraison_livree"),
                    DB::raw("(SELECT COUNT(1) FROM livraisons lv WHERE lv.commande = c.id AND lv.statut = 'en_cours') > 0 as a_livraison_en_cours"),
                ])
                ->first();

            $client = DB::table('clients as cl')
                ->join('commandes as c', 'c.client', '=', 'cl.id')
                ->where('c.id', $commandeId)
                ->select(['cl.id', 'cl.nom', 'cl.prenom', 'cl.telephone', 'cl.email'])
                ->first();

            $statutReservation = $this->calculerStatutReservation(
                $commande->statut,
                (bool) $commande->a_livraison_livree
            );

            $stockReserve    = $produit->type_produit === 'physique' ? (float) $produit->stock_reserve : null;
            $stockDisponible = $produit->type_produit === 'physique'
                ? max(0, (float) $produit->stock_actuel - (float) $produit->stock_reserve)
                : null;

            return response()->json([
                'reservation'=> [
                    'quantite'=> (float) $cp->quantite,
                    'date'    => substr($commande->date_commande, 0, 10),
                    'statut'  => $statutReservation,
                ],
                'produit'    => [
                    'id'              => $produit->id,
                    'nom'             => $produit->nom,
                    'stock_actuel'    => $produit->type_produit === 'physique' ? (float) $produit->stock_actuel : null,
                    'stock_reserve'   => $stockReserve,
                    'stock_disponible'=> $stockDisponible,
                ],
                'commande'   => [
                    'id'     => $commande->id,
                    'numero' => $commande->numero,
                    'statut' => $this->calculerStatutMetier($commande->statut, (bool) $commande->a_livraison_livree, (bool) $commande->a_livraison_en_cours),
                    'date'   => substr($commande->date_commande, 0, 10),
                ],
                'client'     => [
                    'id'        => $client?->id,
                    'nom'       => $client?->nom,
                    'prenom'    => $client?->prenom,
                    'telephone' => $client?->telephone,
                    'email'     => $client?->email,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__, [
                'commande_id' => $commandeId,
                'produit_id'  => $produitId,
            ]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 13 — GET /api/ventes/reservations/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des réservations filtrées en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 11
     */
    public function export(Request $request): JsonResponse
    {
        $format = $request->query('format', 'pdf');

        // TODO: Implémenter la génération de fichier PDF / CSV / DOCX ($format).
        // Même logique que index() sans pagination.
        // Inclure pour chaque réservation : produit, quantité, client, numéro de commande,
        // statut, date, stock actuel, stock réservé, stock disponible.
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => "Export {$format} non encore implémenté.",
        ], 501);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function calculerStatutReservation(string $commandeStatut, bool $aLivraisonLivree): string
    {
        if ($commandeStatut === 'annulee') {
            return 'annulé';
        }
        if ($aLivraisonLivree) {
            return 'validé';
        }
        return 'en_cours';
    }
}
