<?php

namespace App\Services;

use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Service centralisé de génération de fichiers d'export.
 * Gère PDF (DomPDF), DOCX (PhpWord) et CSV natif PHP.
 * Branding AGORA : orange #F39C12 · bleu nuit #2C3E50 · blanc crème #FFF8F0.
 */
class ExportService
{
    // ── Palette AGORA ─────────────────────────────────────────────────────────
    private const PRIMARY   = '#F39C12';
    private const ACCENT    = '#2C3E50';
    private const BG_LIGHT  = '#FFF8F0';
    private const SUCCESS   = '#27AE60';
    private const MUTED     = '#7F8C8D';
    private const BORDER    = '#E8E0D5';

    // ── Docx hex (sans #) ────────────────────────────────────────────────────
    private const DOCX_PRIMARY  = 'F39C12';
    private const DOCX_ACCENT   = '2C3E50';
    private const DOCX_BG       = 'FFF8F0';
    private const DOCX_BORDER   = 'E8E0D5';
    private const DOCX_WHITE    = 'FFFFFF';
    private const DOCX_HEADER   = 'F5F0E8';

    // ─────────────────────────────────────────────────────────────────────────
    // PDF
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Génère et renvoie un PDF avec le branding AGORA.
     *
     * @param array  $rows      Tableau de lignes (chaque ligne = tableau associatif)
     * @param array  $columns   ['clé_données' => 'En-tête colonne', ...]
     * @param string $title     Titre du rapport
     * @param string $subtitle  Sous-titre optionnel (période, filtres, etc.)
     * @param string $filename  Nom du fichier sans extension
     */
    public static function pdf(
        array $rows,
        array $columns,
        string $title,
        string $subtitle = '',
        string $filename = 'export'
    ): Response {
        $html = self::buildHtml($rows, $columns, $title, $subtitle);

        $options = new \Dompdf\Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isPhpEnabled', false);
        $options->set('isRemoteEnabled', false);

        $dompdf = new \Dompdf\Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', count($columns) > 5 ? 'landscape' : 'portrait');
        $dompdf->render();

        $output = $dompdf->output();

        return response($output, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '.pdf"',
            'Cache-Control'       => 'no-store',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DOCX
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Génère et renvoie un fichier DOCX avec le branding AGORA.
     */
    public static function docx(
        array $rows,
        array $columns,
        string $title,
        string $subtitle = '',
        string $filename = 'export'
    ): Response {
        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $phpWord->setDefaultFontName('Arial');
        $phpWord->setDefaultFontSize(10);

        $section = $phpWord->addSection([
            'marginTop'    => \PhpOffice\PhpWord\Shared\Converter::cmToTwip(1.5),
            'marginBottom' => \PhpOffice\PhpWord\Shared\Converter::cmToTwip(1.5),
            'marginLeft'   => \PhpOffice\PhpWord\Shared\Converter::cmToTwip(2),
            'marginRight'  => \PhpOffice\PhpWord\Shared\Converter::cmToTwip(2),
        ]);

        // ── En-tête AGORA ─────────────────────────────────────────────────
        $headerTable = $section->addTable(['borderSize' => 0, 'cellMargin' => 100]);
        $headerTable->addRow();
        $headerCell = $headerTable->addCell(9000, [
            'bgColor' => self::DOCX_ACCENT,
            'valign'  => 'center',
        ]);
        $headerCell->addText(
            'AGORA',
            ['name' => 'Arial', 'size' => 18, 'bold' => true, 'color' => self::DOCX_PRIMARY],
            ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::LEFT, 'spaceAfter' => 0]
        );
        $headerCell->addText(
            'Plateforme de gestion commerciale',
            ['name' => 'Arial', 'size' => 9, 'color' => 'C8C8C8'],
            ['spaceAfter' => 0]
        );

        $section->addTextBreak(1);

        // ── Titre du rapport ─────────────────────────────────────────────
        $section->addText(
            $title,
            ['name' => 'Arial', 'size' => 16, 'bold' => true, 'color' => self::DOCX_ACCENT],
            ['spaceAfter' => 120]
        );

        if ($subtitle) {
            $section->addText(
                $subtitle,
                ['name' => 'Arial', 'size' => 9, 'color' => '7F8C8D', 'italic' => true],
                ['spaceAfter' => 240]
            );
        }

        $section->addText(
            'Généré le ' . now()->format('d/m/Y à H:i'),
            ['name' => 'Arial', 'size' => 8, 'color' => '7F8C8D'],
            ['spaceAfter' => 360]
        );

        // ── Tableau de données ───────────────────────────────────────────
        $colCount  = count($columns);
        $totalWidth = 9000;
        $colWidth  = $colCount > 0 ? intdiv($totalWidth, $colCount) : $totalWidth;

        $table = $section->addTable([
            'borderSize'  => 6,
            'borderColor' => self::DOCX_BORDER,
            'cellMargin'  => 80,
        ]);

        // Header row
        $table->addRow(500);
        foreach ($columns as $label) {
            $cell = $table->addCell($colWidth, ['bgColor' => self::DOCX_ACCENT]);
            $cell->addText(
                $label,
                ['name' => 'Arial', 'size' => 9, 'bold' => true, 'color' => self::DOCX_WHITE],
                ['spaceAfter' => 0]
            );
        }

        // Data rows
        foreach ($rows as $i => $row) {
            $table->addRow(380);
            $bgColor = $i % 2 === 0 ? self::DOCX_WHITE : self::DOCX_HEADER;
            foreach (array_keys($columns) as $key) {
                $cell = $table->addCell($colWidth, ['bgColor' => $bgColor]);
                $value = $row[$key] ?? '—';
                $cell->addText(
                    is_string($value) ? $value : (string) $value,
                    ['name' => 'Arial', 'size' => 9, 'color' => self::DOCX_ACCENT],
                    ['spaceAfter' => 0]
                );
            }
        }

        $section->addTextBreak(1);

        // ── Pied de page ─────────────────────────────────────────────────
        $section->addText(
            'AGORA — Document généré automatiquement · ' . count($rows) . ' enregistrement(s)',
            ['name' => 'Arial', 'size' => 8, 'color' => '7F8C8D', 'italic' => true],
            ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]
        );

        // ── Écriture et envoi ────────────────────────────────────────────
        $tmpFile = tempnam(sys_get_temp_dir(), 'agora_export_') . '.docx';

        $writer = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
        $writer->save($tmpFile);

        $content  = file_get_contents($tmpFile);
        @unlink($tmpFile);

        return response($content, 200, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="' . $filename . '.docx"',
            'Cache-Control'       => 'no-store',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CSV
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Génère et renvoie un fichier CSV (UTF-8 avec BOM pour Excel).
     */
    public static function csv(
        array $rows,
        array $columns,
        string $filename = 'export'
    ): StreamedResponse {
        return response()->stream(function () use ($rows, $columns) {
            $handle = fopen('php://output', 'w');

            // BOM UTF-8 pour compatibilité Excel
            fwrite($handle, "\xEF\xBB\xBF");

            // En-tête
            fputcsv($handle, array_values($columns), ';');

            // Lignes
            foreach ($rows as $row) {
                $line = [];
                foreach (array_keys($columns) as $key) {
                    $val    = $row[$key] ?? '';
                    $line[] = is_string($val) ? $val : (string) $val;
                }
                fputcsv($handle, $line, ';');
            }

            fclose($handle);
        }, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '.csv"',
            'Cache-Control'       => 'no-store',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTML interne pour DomPDF
    // ─────────────────────────────────────────────────────────────────────────

    private static function buildHtml(array $rows, array $columns, string $title, string $subtitle): string
    {
        $cPrimary = self::PRIMARY;
        $cAccent  = self::ACCENT;
        $cMuted   = self::MUTED;
        $cBorder  = self::BORDER;

        $headerCells = '';
        foreach ($columns as $label) {
            $headerCells .= '<th>' . htmlspecialchars($label) . '</th>';
        }

        $bodyRows = '';
        foreach ($rows as $i => $row) {
            $bg = $i % 2 === 0 ? '#FFFFFF' : '#F5F0E8';
            $bodyRows .= '<tr style="background:' . $bg . '">';
            foreach (array_keys($columns) as $key) {
                $value = $row[$key] ?? '—';
                $bodyRows .= '<td>' . htmlspecialchars((string) $value) . '</td>';
            }
            $bodyRows .= '</tr>';
        }

        $subtitleHtml = $subtitle
            ? '<p style="margin:0 0 4px;font-size:10px;color:' . $cMuted . ';font-style:italic;">'
              . htmlspecialchars($subtitle) . '</p>'
            : '';

        $count = count($rows);
        $date  = now()->format('d/m/Y à H:i');
        $titleH = htmlspecialchars($title);

        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: DejaVu Sans, Arial, sans-serif;
    font-size: 10px;
    color: {$cAccent};
    background: #FFFFFF;
  }
  .header {
    background: {$cAccent};
    padding: 12px 16px;
    margin-bottom: 0;
  }
  .header__brand {
    font-size: 20px;
    font-weight: bold;
    color: {$cPrimary};
    letter-spacing: 2px;
  }
  .header__sub {
    font-size: 8px;
    color: #CCCCCC;
    margin-top: 2px;
  }
  .accent-bar {
    height: 3px;
    background: {$cPrimary};
    margin-bottom: 12px;
  }
  .report-title {
    font-size: 15px;
    font-weight: bold;
    color: {$cAccent};
    margin: 0 16px 4px;
  }
  .report-meta {
    font-size: 8px;
    color: {$cMuted};
    margin: 0 16px 12px;
  }
  table {
    width: calc(100% - 32px);
    border-collapse: collapse;
    margin: 0 16px;
    font-size: 9px;
  }
  thead tr {
    background: {$cAccent};
    color: #FFFFFF;
  }
  thead th {
    padding: 6px 8px;
    text-align: left;
    font-weight: bold;
    border: 1px solid {$cBorder};
  }
  tbody td {
    padding: 5px 8px;
    border: 1px solid {$cBorder};
    color: {$cAccent};
  }
  .footer {
    margin-top: 12px;
    font-size: 8px;
    color: {$cMuted};
    text-align: center;
    border-top: 1px solid {$cBorder};
    padding-top: 6px;
    font-style: italic;
    margin-left: 16px;
    margin-right: 16px;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="header__brand">AGORA</div>
    <div class="header__sub">Plateforme de gestion commerciale</div>
  </div>
  <div class="accent-bar"></div>
  <p class="report-title">{$titleH}</p>
  {$subtitleHtml}
  <p class="report-meta">Généré le {$date} · {$count} enregistrement(s)</p>
  <table>
    <thead><tr>{$headerCells}</tr></thead>
    <tbody>{$bodyRows}</tbody>
  </table>
  <p class="footer">AGORA — Document généré automatiquement. Confidentiel.</p>
</body>
</html>
HTML;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** Dispatch vers le bon format et retourne la réponse HTTP. */
    public static function dispatch(
        string $format,
        array $rows,
        array $columns,
        string $title,
        string $subtitle = '',
        string $filename = 'export'
    ): Response|StreamedResponse {
        return match (strtolower($format)) {
            'csv', 'xlsx' => self::csv($rows, $columns, $filename),
            'docx'        => self::docx($rows, $columns, $title, $subtitle, $filename),
            default       => self::pdf($rows, $columns, $title, $subtitle, $filename),
        };
    }

    /** Formate un montant XAF. */
    public static function fmtMontant(float|int|null $amount): string
    {
        if ($amount === null || !is_numeric($amount)) return '—';
        return number_format((float) $amount, 0, ',', ' ') . ' XAF';
    }

    /** Formate une date dd/mm/YYYY. */
    public static function fmtDate(?string $date): string
    {
        if (!$date) return '—';
        try {
            return \Carbon\Carbon::parse($date)->format('d/m/Y');
        } catch (\Exception) {
            return $date;
        }
    }

    /** Formate une date + heure. */
    public static function fmtDatetime(?string $date): string
    {
        if (!$date) return '—';
        try {
            return \Carbon\Carbon::parse($date)->format('d/m/Y H:i');
        } catch (\Exception) {
            return $date;
        }
    }
}
