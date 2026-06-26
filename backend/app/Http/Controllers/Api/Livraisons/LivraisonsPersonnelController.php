<?php

namespace App\Http\Controllers\Api\Livraisons;

use App\Services\ExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LivraisonsPersonnelController extends LivraisonsBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 7 — GET /api/livraisons/mes-livraisons
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Livraisons en cours assignées au livreur connecté, avec produits.
     */
    public function mesLivraisons(Request $request): JsonResponse
    {
        try {
            $user = $this->currentUser($request);

            $livraisons = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('l.livreur', $user->id)
                ->where('l.statut', 'en_cours')
                ->where('l.actif', true)
                ->orderBy('l.date_creation', 'asc')
                ->select([
                    'l.id',
                    'l.statut',
                    'l.date_lancement',
                    'c.id as commande_id',
                    'c.montant_commande',
                    'c.adresse_livraison',
                    'c.date_livraison_prevue',
                    DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client_nom"),
                    'cl.telephone',
                    $this->numeroCommandeRaw(),
                ])
                ->get();

            if ($livraisons->isEmpty()) {
                return response()->json(['data' => []], 200);
            }

            $commandeIds = $livraisons->pluck('commande_id');

            $allProduits = DB::table('contenir_produit as cp')
                ->join('produits as p', 'p.id', '=', 'cp.produit_id')
                ->whereIn('cp.commande_id', $commandeIds)
                ->select(['cp.commande_id', 'p.nom', 'cp.quantite', 'cp.prix_unitaire'])
                ->get()
                ->groupBy('commande_id');

            $data = $livraisons->map(fn($row) => [
                'id'           => $row->id,
                'commande'     => $row->numero_cmd,
                'client'       => $row->client_nom,
                'telephone'    => $row->telephone,
                'adresse'      => $row->adresse_livraison,
                'montant'      => (float) $row->montant_commande,
                'dateLancement'=> $row->date_lancement,
                'statut'       => $row->statut,
                'produits'     => ($allProduits[$row->commande_id] ?? collect())
                    ->map(fn($p) => [
                        'nom'      => $p->nom,
                        'quantite' => (float) $p->quantite,
                        'prix'     => (float) $p->prix_unitaire,
                    ])->values(),
            ]);

            return response()->json(['data' => $data], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 8 — GET /api/livraisons/mes-livraisons/historique
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Historique personnel du livreur connecté, paginé et filtré.
     *
     * Query params : page, per_page, recherche, statut, date_debut, date_fin
     */
    public function mesLivraisonsHistorique(Request $request): JsonResponse
    {
        try {
            $user = $this->currentUser($request);

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche = trim((string) $request->query('recherche', ''));
            $statut    = $request->query('statut', 'tous');
            $dateDebut = $request->query('date_debut');
            $dateFin   = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('l.livreur', $user->id)
                ->where('l.actif', true);

            if ($statut !== 'tous') {
                $query->where('l.statut', $statut);
            }

            if ($from) {
                $query->where('l.date_creation', '>=', $from);
            }
            if ($to) {
                $query->where('l.date_creation', '<=', $to);
            }

            if ($recherche !== '') {
                $cmdNumExpr = $this->cmdNumExprSql();
                $query->where(function ($q) use ($recherche, $cmdNumExpr) {
                    $q->whereRaw($cmdNumExpr . " ILIKE ?", ['%' . $recherche . '%'])
                      ->orWhereRaw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) ILIKE ?", ['%' . $recherche . '%']);
                });
            }

            $total = $query->count();

            $livraisons = $query
                ->orderBy('l.date_creation', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'l.id',
                    'l.statut',
                    'l.motif_echec',
                    'l.motif_retour',
                    'l.date_creation',
                    'l.date_lancement',
                    'l.date_livraison_effective',
                    'c.id as commande_id',
                    'c.montant_commande',
                    'c.adresse_livraison',
                    DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client_nom"),
                    'cl.telephone',
                    $this->numeroCommandeRaw(),
                ])
                ->get();

            if ($livraisons->isEmpty()) {
                return response()->json([
                    'data' => [],
                    'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total],
                ], 200);
            }

            $commandeIds = $livraisons->pluck('commande_id');

            $allProduits = DB::table('contenir_produit as cp')
                ->join('produits as p', 'p.id', '=', 'cp.produit_id')
                ->whereIn('cp.commande_id', $commandeIds)
                ->select(['cp.commande_id', 'p.nom', 'cp.quantite', 'cp.prix_unitaire'])
                ->get()
                ->groupBy('commande_id');

            $data = $livraisons->map(fn($row) => [
                'id'            => $row->id,
                'commande'      => $row->numero_cmd,
                'client'        => $row->client_nom,
                'telephone'     => $row->telephone,
                'adresse'       => $row->adresse_livraison,
                'montant'       => (float) $row->montant_commande,
                'statut'        => $row->statut,
                'motif'         => $row->motif_echec ?? $row->motif_retour ?? null,
                'dateCreation'  => $row->date_creation,
                'dateLancement' => $row->date_lancement,
                'dateLivraison' => $row->date_livraison_effective,
                'produits'      => ($allProduits[$row->commande_id] ?? collect())
                    ->map(fn($p) => [
                        'nom'      => $p->nom,
                        'quantite' => (float) $p->quantite,
                        'prix'     => (float) $p->prix_unitaire,
                    ])->values(),
            ]);

            return response()->json([
                'data' => $data,
                'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total],
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 9 — GET /api/livraisons/mes-livraisons/historique/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export de l'historique personnel en PDF, CSV ou DOCX.
     *
     * TODO: Implémenter la génération de fichier PDF / CSV / DOCX.
     * Même logique que mesLivraisonsHistorique() sans pagination.
     * Inclure en plus : motif_echec / motif_retour si applicable.
     */
    /**
     * Fonction 1 — Point d'entrée export historique personnel livreur.
     */
    public function mesLivraisonsExport(Request $request): Response|StreamedResponse
    {
        $user     = $this->currentUser($request);
        $format   = strtolower($request->query('format', 'pdf'));

        $rows    = $this->buildPersonnelExportRows($request, $user->id);
        $columns = [
            'commande'      => 'N° Commande',
            'client'        => 'Client',
            'telephone'     => 'Téléphone',
            'adresse'       => 'Adresse',
            'montant'       => 'Montant',
            'statut'        => 'Statut',
            'motif'         => 'Motif',
            'dateCreation'  => 'Date création',
            'dateLancement' => 'Date lancement',
            'dateLivraison' => 'Date livraison',
        ];
        $prenom   = $user->prenom ?? '';
        $subtitle = 'Livreur : ' . $user->nom . ($prenom ? ' ' . $prenom : '');
        $filename = 'agora-mes-livraisons-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => $this->generateCsv($rows, $columns, $filename),
            'docx'        => $this->generateDocx($rows, $columns, 'Mon Historique de Livraisons', $subtitle, $filename),
            default       => $this->generatePdf($rows, $columns, 'Mon Historique de Livraisons', $subtitle, $filename),
        };
    }

    /**
     * Fonction 2 — Génère un fichier PDF avec le branding AGORA.
     */
    protected function generatePdf(array $rows, array $columns, string $title, string $subtitle, string $filename): Response
    {
        return ExportService::pdf($rows, $columns, $title, $subtitle, $filename);
    }

    /**
     * Fonction 3 — Génère un fichier DOCX (Word).
     */
    protected function generateDocx(array $rows, array $columns, string $title, string $subtitle, string $filename): Response
    {
        return ExportService::docx($rows, $columns, $title, $subtitle, $filename);
    }

    /**
     * Fonction 4 — Génère un fichier CSV.
     */
    protected function generateCsv(array $rows, array $columns, string $filename): StreamedResponse
    {
        return ExportService::csv($rows, $columns, $filename);
    }

    private function buildPersonnelExportRows(Request $request, string $userId): array
    {
        $recherche = trim((string) $request->query('recherche', ''));
        $statut    = $request->query('statut', 'tous');
        $dateDebut = $request->query('date_debut');
        $dateFin   = $request->query('date_fin');

        [$from, $to] = $this->daterange($dateDebut, $dateFin);

        $query = DB::table('livraisons as l')
            ->join('commandes as c', 'c.id', '=', 'l.commande')
            ->join('clients as cl', 'cl.id', '=', 'c.client')
            ->where('l.livreur', $userId)
            ->where('l.actif', true);

        if ($statut !== 'tous') $query->where('l.statut', $statut);
        if ($from) $query->where('l.date_creation', '>=', $from);
        if ($to)   $query->where('l.date_creation', '<=', $to);

        if ($recherche !== '') {
            $cmdNum = $this->cmdNumExprSql();
            $query->where(function ($q) use ($recherche, $cmdNum) {
                $q->whereRaw("$cmdNum ILIKE ?", ["%$recherche%"])
                  ->orWhereRaw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) ILIKE ?", ["%$recherche%"]);
            });
        }

        return $query
            ->orderBy('l.date_creation', 'desc')
            ->select([
                'l.statut',
                'l.motif_echec',
                'l.motif_retour',
                'l.date_creation',
                'l.date_lancement',
                'l.date_livraison_effective',
                'c.montant_commande',
                'c.adresse_livraison',
                DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client_nom"),
                'cl.telephone',
                $this->numeroCommandeRaw(),
            ])
            ->get()
            ->map(fn($r) => [
                'commande'      => $r->numero_cmd ?? '—',
                'client'        => $r->client_nom,
                'telephone'     => $r->telephone ?? '—',
                'adresse'       => $r->adresse_livraison ?? '—',
                'montant'       => ExportService::fmtMontant($r->montant_commande),
                'statut'        => ucfirst($r->statut),
                'motif'         => $r->motif_echec ?? $r->motif_retour ?? '—',
                'dateCreation'  => ExportService::fmtDate($r->date_creation),
                'dateLancement' => ExportService::fmtDate($r->date_lancement),
                'dateLivraison' => ExportService::fmtDate($r->date_livraison_effective),
            ])
            ->toArray();
    }

    // ── Helper SQL inline ─────────────────────────────────────────────────────

    private function cmdNumExprSql(): string
    {
        return "(CONCAT('CMD-', EXTRACT(YEAR FROM c.date_commande)::int, '-', " .
            "LPAD((SELECT COUNT(c2.id) FROM commandes c2 " .
            "WHERE c2.entreprise = c.entreprise " .
            "AND EXTRACT(YEAR FROM c2.date_commande) = EXTRACT(YEAR FROM c.date_commande) " .
            "AND (c2.date_commande < c.date_commande OR (c2.date_commande = c.date_commande AND c2.id::text <= c.id::text))" .
            ")::text, 5, '0')))";
    }
}
