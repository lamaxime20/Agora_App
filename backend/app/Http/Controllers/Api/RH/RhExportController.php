<?php

namespace App\Http\Controllers\Api\RH;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RhExportController extends RhBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 7 — GET /api/rh/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des données RH en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), context (dashboard|rh_employees|rh_statistics)
     *
     * TODO: Implémenter la génération réelle des fichiers.
     * La logique à implémenter :
     *  - Récupérer les mêmes données que fetchRhEmployees() (filtrées si context = employees)
     *  - Ou les données statistiques si context = statistics
     *  - Générer le fichier via une librairie (ex: PhpSpreadsheet pour CSV/DOCX, DomPDF pour PDF)
     *  - Stocker temporairement dans storage/app/exports/rh/
     *  - Retourner l'URL signée ou le flux binaire
     */
    public function export(Request $request): JsonResponse
    {
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => 'Export RH non encore implémenté.',
        ], 501);
    }
}
