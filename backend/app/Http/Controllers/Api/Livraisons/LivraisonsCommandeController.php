<?php

namespace App\Http\Controllers\Api\Livraisons;

use App\Services\ExportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LivraisonsCommandeController extends LivraisonsBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 2 — GET /api/livraisons/commandes-a-livrer
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Commandes validées éligibles à une nouvelle livraison.
     *
     * Query params : page, per_page, recherche
     */
    public function commandesALivrer(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche = trim((string) $request->query('recherche', ''));

            $query = DB::table('commandes as c')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.statut', 'validee')
                ->where('c.entreprise', $entrepriseId)
                ->where('c.actif', true)
                // Exclure si total payé < montant minimum validation
                ->whereRaw(
                    "(SELECT COALESCE(SUM(p.montant), 0) FROM payements p WHERE p.commande = c.id AND p.actif = TRUE) >= COALESCE(c.montant_minimum_validation, c.montant_commande)"
                )
                // Exclure si livraison en_cours existe
                ->whereNotExists(function ($q) {
                    $q->selectRaw('1')
                      ->from('livraisons as lv_enc')
                      ->whereRaw('lv_enc.commande = c.id')
                      ->where('lv_enc.statut', 'en_cours')
                      ->where('lv_enc.actif', true);
                })
                // Exclure si livraison livree existe
                ->whereNotExists(function ($q) {
                    $q->selectRaw('1')
                      ->from('livraisons as lv_liv')
                      ->whereRaw('lv_liv.commande = c.id')
                      ->where('lv_liv.statut', 'livree')
                      ->where('lv_liv.actif', true);
                });

            if ($recherche !== '') {
                $cmdNumExpr = $this->cmdNumExprSql();
                $query->where(function ($q) use ($recherche, $cmdNumExpr) {
                    $q->whereRaw($cmdNumExpr . " ILIKE ?", ['%' . $recherche . '%'])
                      ->orWhereRaw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) ILIKE ?", ['%' . $recherche . '%']);
                });
            }

            $total = $query->count();

            $data = $query
                ->orderBy('c.date_commande', 'asc')
                ->forPage($page, $perPage)
                ->select([
                    'c.id',
                    'c.date_commande',
                    'c.montant_commande',
                    $this->numeroCommandeRaw(),
                    DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client_nom"),
                    DB::raw("(SELECT COALESCE(SUM(p.montant), 0) FROM payements p WHERE p.commande = c.id AND p.actif = TRUE) as total_paye"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'           => $row->id,
                    'numero'       => $row->numero_cmd,
                    'client'       => $row->client_nom,
                    'montant'      => (float) $row->montant_commande,
                    'date'         => Carbon::parse($row->date_commande)->format('Y-m-d'),
                    'etatPaiement' => ((float) $row->total_paye >= (float) $row->montant_commande) ? 'valide' : 'partiel',
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
    // ROUTE 3 — GET /api/livraisons/historique
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Toutes les livraisons de l'entreprise, paginées et filtrées.
     *
     * Query params : page, per_page, recherche, statut, date_debut, date_fin
     */
    public function historique(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

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
                ->join('utilisateurs as u', 'u.id', '=', 'l.livreur')
                ->where('c.entreprise', $entrepriseId)
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
                $livNumExpr = $this->livNumExprSql($entrepriseId);
                $cmdNumExpr = $this->cmdNumExprSql();
                $query->where(function ($q) use ($recherche, $livNumExpr, $cmdNumExpr) {
                    $q->whereRaw($livNumExpr . " ILIKE ?", ['%' . $recherche . '%'])
                      ->orWhereRaw($cmdNumExpr . " ILIKE ?", ['%' . $recherche . '%'])
                      ->orWhereRaw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) ILIKE ?", ['%' . $recherche . '%'])
                      ->orWhereRaw("CONCAT(u.name, ' ', u.prename) ILIKE ?", ['%' . $recherche . '%']);
                });
            }

            $total = $query->count();

            $data = $query
                ->orderBy('l.date_creation', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'l.id',
                    'l.statut',
                    'l.date_creation',
                    'l.date_lancement',
                    'l.date_livraison_effective',
                    'c.montant_commande',
                    DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client_nom"),
                    DB::raw("CONCAT(u.name, ' ', u.prename) as livreur_nom"),
                    $this->numeroLivraisonRaw($entrepriseId),
                    $this->numeroCommandeRaw(),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'           => $row->id,
                    'numero'       => $row->numero_liv,
                    'commande'     => $row->numero_cmd,
                    'client'       => $row->client_nom,
                    'livreur'      => $row->livreur_nom,
                    'statut'       => $row->statut,
                    'montant'      => (float) $row->montant_commande,
                    'dateCreation' => $row->date_creation,
                    'dateLancement'=> $row->date_lancement,
                    'dateLivraison'=> $row->date_livraison_effective,
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
    // ROUTE 4 — GET /api/livraisons/{id}
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Détail complet d'une livraison avec produits de la commande.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $livraison = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->join('utilisateurs as u', 'u.id', '=', 'l.livreur')
                ->where('l.id', $id)
                ->where('l.actif', true)
                ->where('c.entreprise', $entrepriseId)
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
                    DB::raw("CONCAT(u.name, ' ', u.prename) as livreur_nom"),
                    DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client_nom"),
                    'cl.telephone',
                ])
                ->first();

            if (!$livraison) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Livraison introuvable.',
                ], 404);
            }

            $numeroLiv = $this->calcNumeroLivraison($id, $entrepriseId);
            $numeroCMD = $this->calcNumeroCommande($livraison->commande_id);

            $produits = DB::table('contenir_produit as cp')
                ->join('produits as p', 'p.id', '=', 'cp.produit_id')
                ->where('cp.commande_id', $livraison->commande_id)
                ->select(['p.nom', 'cp.quantite', 'cp.prix_unitaire'])
                ->get()
                ->map(fn($row) => [
                    'nom'      => $row->nom,
                    'quantite' => (float) $row->quantite,
                    'prix'     => (float) $row->prix_unitaire,
                ]);

            $motif = $livraison->motif_echec ?? $livraison->motif_retour ?? null;

            return response()->json([
                'id'            => $livraison->id,
                'numero'        => $numeroLiv,
                'statut'        => $livraison->statut,
                'motif'         => $motif,
                'dateCreation'  => $livraison->date_creation,
                'dateLancement' => $livraison->date_lancement,
                'dateLivraison' => $livraison->date_livraison_effective,
                'livreur'       => $livraison->livreur_nom,
                'commande'      => $numeroCMD,
                'client'        => $livraison->client_nom,
                'telephone'     => $livraison->telephone,
                'adresse'       => $livraison->adresse_livraison,
                'montant'       => (float) $livraison->montant_commande,
                'produits'      => $produits,
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__, ['livraison_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 5 — GET /api/livraisons/historique/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export de l'historique global en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 3
     *
     * TODO: Implémenter la génération de fichier PDF / CSV / DOCX.
     * Même logique que historique() sans pagination.
     * Inclure en plus : adresse_livraison, liste produits, motif_echec / motif_retour / raison_annulation.
     */
    /**
     * Fonction 1 — Point d'entrée export. Récupère les données filtrées
     * et délègue au générateur du format demandé.
     */
    public function exportHistorique(Request $request): Response|StreamedResponse
    {
        $entreprise   = $this->currentEntreprise($request);
        $entrepriseId = $entreprise->id;
        $format       = strtolower($request->query('format', 'pdf'));

        $rows     = $this->buildExportRows($request, $entrepriseId);
        $columns  = [
            'numero'        => 'N° Livraison',
            'commande'      => 'N° Commande',
            'client'        => 'Client',
            'livreur'       => 'Livreur',
            'statut'        => 'Statut',
            'montant'       => 'Montant',
            'dateCreation'  => 'Date création',
            'dateLancement' => 'Date lancement',
            'dateLivraison' => 'Date livraison',
        ];
        $subtitle = $this->buildSubtitle($request);
        $filename = 'agora-livraisons-historique-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => $this->generateCsv($rows, $columns, $filename),
            'docx'        => $this->generateDocx($rows, $columns, 'Historique des Livraisons', $subtitle, $filename),
            default       => $this->generatePdf($rows, $columns, 'Historique des Livraisons', $subtitle, $filename),
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

    private function buildExportRows(Request $request, string $entrepriseId): array
    {
        $recherche = trim((string) $request->query('recherche', ''));
        $statut    = $request->query('statut', 'tous');
        $dateDebut = $request->query('date_debut');
        $dateFin   = $request->query('date_fin');

        [$from, $to] = $this->daterange($dateDebut, $dateFin);

        $query = DB::table('livraisons as l')
            ->join('commandes as c', 'c.id', '=', 'l.commande')
            ->join('clients as cl', 'cl.id', '=', 'c.client')
            ->join('utilisateurs as u', 'u.id', '=', 'l.livreur')
            ->where('c.entreprise', $entrepriseId)
            ->where('l.actif', true);

        if ($statut !== 'tous') {
            $query->where('l.statut', $statut);
        }
        if ($from) $query->where('l.date_creation', '>=', $from);
        if ($to)   $query->where('l.date_creation', '<=', $to);

        if ($recherche !== '') {
            $livNum = $this->livNumExprSql($entrepriseId);
            $cmdNum = $this->cmdNumExprSql();
            $query->where(function ($q) use ($recherche, $livNum, $cmdNum) {
                $q->whereRaw("$livNum ILIKE ?", ["%$recherche%"])
                  ->orWhereRaw("$cmdNum ILIKE ?", ["%$recherche%"])
                  ->orWhereRaw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) ILIKE ?", ["%$recherche%"])
                  ->orWhereRaw("CONCAT(u.name, ' ', u.prename) ILIKE ?", ["%$recherche%"]);
            });
        }

        return $query
            ->orderBy('l.date_creation', 'desc')
            ->select([
                'l.statut',
                'l.date_creation',
                'l.date_lancement',
                'l.date_livraison_effective',
                'c.montant_commande',
                DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client_nom"),
                DB::raw("CONCAT(u.name, ' ', u.prename) as livreur_nom"),
                $this->numeroLivraisonRaw($entrepriseId),
                $this->numeroCommandeRaw(),
            ])
            ->get()
            ->map(fn($r) => [
                'numero'        => $r->numero_liv ?? '—',
                'commande'      => $r->numero_cmd ?? '—',
                'client'        => $r->client_nom,
                'livreur'       => $r->livreur_nom,
                'statut'        => ucfirst($r->statut),
                'montant'       => ExportService::fmtMontant($r->montant_commande),
                'dateCreation'  => ExportService::fmtDate($r->date_creation),
                'dateLancement' => ExportService::fmtDate($r->date_lancement),
                'dateLivraison' => ExportService::fmtDate($r->date_livraison_effective),
            ])
            ->toArray();
    }

    private function buildSubtitle(Request $request): string
    {
        $parts  = [];
        $statut = $request->query('statut', 'tous');
        if ($statut !== 'tous') $parts[] = 'Statut : ' . ucfirst($statut);
        if ($d = $request->query('date_debut')) $parts[] = 'Du ' . $d;
        if ($f = $request->query('date_fin'))   $parts[] = 'Au ' . $f;
        return implode(' · ', $parts) ?: 'Toutes les livraisons';
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 6 — GET /api/livraisons/livreurs
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Utilisateurs actifs avec le rôle employe_livreur dans l'entreprise.
     *
     * Query params : recherche
     */
    public function livreurs(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $recherche = trim((string) $request->query('recherche', ''));

            $query = DB::table('appartenir_entreprise as ae')
                ->join('utilisateurs as u', 'u.id', '=', 'ae.utilisateur_id')
                ->join('roles_utilisateur as ru', 'ru.id', '=', 'ae.role_utilisateur_id')
                ->where('ae.entreprise_id', $entrepriseId)
                ->where('ae.statut', 'actif')
                ->whereIn('ru.role', ['employe_livraison', 'manager_livraison']);

            if ($recherche !== '') {
                $query->whereRaw("CONCAT(u.name, ' ', u.prename) ILIKE ?", ['%' . $recherche . '%']);
            }

            $livreurs = $query
                ->orderBy('u.name', 'asc')
                ->select(['u.id', DB::raw("CONCAT(u.name, ' ', u.prename) as nom"), 'u.email'])
                ->get();

            if ($livreurs->isEmpty()) {
                return response()->json(['data' => []], 200);
            }

            $livreurIds = $livreurs->pluck('id');

            $enCoursCounts = DB::table('livraisons')
                ->whereIn('livreur', $livreurIds)
                ->where('statut', 'en_cours')
                ->where('actif', true)
                ->selectRaw('livreur, COUNT(*) as nb')
                ->groupBy('livreur')
                ->get()
                ->keyBy('livreur');

            $data = $livreurs->map(fn($l) => [
                'id'                 => $l->id,
                'nom'                => $l->nom,
                'telephone'          => null, // champ non présent dans utilisateurs ; étendre si profil disponible
                'livraisonsEnCours'  => (int) ($enCoursCounts[$l->id]?->nb ?? 0),
            ]);

            return response()->json(['data' => $data], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ── Helpers SQL inline ────────────────────────────────────────────────────

    /**
     * Expression SQL (chaîne) pour générer le numéro LIV, pour usage dans WHERE/ILIKE.
     */
    private function livNumExprSql(string $entrepriseId): string
    {
        return "(CONCAT('LIV-', EXTRACT(YEAR FROM l.date_creation)::int, '-', " .
            "LPAD((SELECT COUNT(l2.id) FROM livraisons l2 " .
            "JOIN commandes c2_s ON c2_s.id = l2.commande " .
            "WHERE c2_s.entreprise = '" . $entrepriseId . "' " .
            "AND EXTRACT(YEAR FROM l2.date_creation) = EXTRACT(YEAR FROM l.date_creation) " .
            "AND (l2.date_creation < l.date_creation OR (l2.date_creation = l.date_creation AND l2.id::text <= l.id::text))" .
            ")::text, 5, '0')))";
    }

    /**
     * Expression SQL (chaîne) pour générer le numéro CMD, pour usage dans WHERE/ILIKE.
     */
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
