<?php

namespace App\Http\Controllers\Api\RH;

use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RhExportController extends RhBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 7 — GET /api/rh/export
    // Query params : format (pdf|csv|docx), context (dashboard|employees|statistics)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Fonction 1 — Point d'entrée principal.
     * Récupère les données selon le contexte et les filtres,
     * puis délègue à la fonction de génération du format demandé.
     */
    public function export(Request $request): Response|StreamedResponse
    {
        $entreprise   = $this->currentEntreprise($request);
        $entrepriseId = $entreprise->id;
        $format       = strtolower($request->query('format', 'pdf'));
        $context      = $request->query('context', 'employees');

        [$rows, $columns, $subtitle] = $this->buildData($entrepriseId, $context);

        $title    = $this->resolveTitle($context);
        $filename = 'agora-rh-' . $context . '-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => $this->generateCsv($rows, $columns, $filename),
            'docx'        => $this->generateDocx($rows, $columns, $title, $subtitle, $filename),
            default       => $this->generatePdf($rows, $columns, $title, $subtitle, $filename),
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

    // ── Helpers privés ────────────────────────────────────────────────────────

    private function buildData(string $entrepriseId, string $context): array
    {
        if ($context === 'statistics') {
            return $this->buildStatisticsData($entrepriseId);
        }
        return $this->buildEmployeesData($entrepriseId);
    }

    private function buildEmployeesData(string $entrepriseId): array
    {
        $rows = DB::table('utilisateurs as u')
            ->join('appartenir_entreprise as ae', 'ae.utilisateur', '=', 'u.id')
            ->join('role_utilisateur as ru', 'ru.id', '=', 'ae.role')
            ->where('ae.entreprise', $entrepriseId)
            ->where('ae.actif', true)
            ->orderBy('u.nom')
            ->get([
                'u.nom',
                'u.prenom',
                'u.email',
                'ru.libelle as role',
                'ae.salaire',
                'ae.date_entree',
            ])
            ->map(fn($r) => [
                'nom'        => $r->nom . ' ' . $r->prenom,
                'email'      => $r->email,
                'role'       => $r->role ?? '—',
                'salaire'    => ExportService::fmtMontant($r->salaire),
                'date_entree' => ExportService::fmtDate($r->date_entree),
            ])
            ->toArray();

        $columns = [
            'nom'         => 'Nom complet',
            'email'       => 'Email',
            'role'        => 'Rôle',
            'salaire'     => 'Salaire',
            'date_entree' => 'Date d\'entrée',
        ];

        return [$rows, $columns, 'Liste des employés actifs'];
    }

    private function buildStatisticsData(string $entrepriseId): array
    {
        $rows = DB::table('utilisateurs as u')
            ->join('appartenir_entreprise as ae', 'ae.utilisateur', '=', 'u.id')
            ->join('role_utilisateur as ru', 'ru.id', '=', 'ae.role')
            ->where('ae.entreprise', $entrepriseId)
            ->where('ae.actif', true)
            ->selectRaw('ru.libelle as role, COUNT(u.id) as nb_employes, COALESCE(SUM(ae.salaire), 0) as masse_salariale, AVG(ae.salaire) as salaire_moyen')
            ->groupBy('ru.libelle')
            ->orderByDesc('nb_employes')
            ->get()
            ->map(fn($r) => [
                'role'             => $r->role ?? '—',
                'nb_employes'      => $r->nb_employes,
                'masse_salariale'  => ExportService::fmtMontant($r->masse_salariale),
                'salaire_moyen'    => ExportService::fmtMontant($r->salaire_moyen),
            ])
            ->toArray();

        $columns = [
            'role'            => 'Rôle',
            'nb_employes'     => 'Nb. employés',
            'masse_salariale' => 'Masse salariale',
            'salaire_moyen'   => 'Salaire moyen',
        ];

        return [$rows, $columns, 'Statistiques RH par rôle'];
    }

    private function resolveTitle(string $context): string
    {
        return match ($context) {
            'statistics' => 'Statistiques Ressources Humaines',
            default      => 'Liste des Employés — Ressources Humaines',
        };
    }
}
