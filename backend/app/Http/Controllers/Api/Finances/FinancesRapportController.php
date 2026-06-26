<?php

namespace App\Http\Controllers\Api\Finances;

use App\Services\ExportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancesRapportController extends FinancesBaseController
{
    public function export(Request $request): Response|StreamedResponse
    {
        $entreprise = $this->currentEntreprise($request);
        $format     = strtolower($request->query('format', 'pdf'));
        $rapport    = $request->query('rapport', 'tableau_bord');
        $periode    = $request->query('periode', 'mensuel');

        [$from, $to] = $this->periodeToRange($periode);

        [$rows, $columns, $title] = match ($rapport) {
            'grand_livre'      => $this->grandLivre($entreprise->id, $from, $to),
            'bilan_salaires'   => $this->bilanSalaires($entreprise->id, $from, $to),
            'etat_tresorerie'  => $this->etatTresorerie($entreprise->id, $from, $to),
            'rapport_depenses' => $this->rapportDepenses($entreprise->id, $from, $to),
            'rapport_reappro'  => $this->rapportReappro($entreprise->id, $from, $to),
            'global'           => $this->grandLivre($entreprise->id, $from, $to),
            default            => $this->tableauBord($entreprise->id, $from, $to),
        };

        $subtitle = 'Période : ' . ucfirst($periode) . ' — ' . $from->format('d/m/Y') . ' au ' . $to->format('d/m/Y');
        $filename = 'agora-rapport-' . str_replace('_', '-', $rapport) . '-' . $periode . '-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => ExportService::csv($rows, $columns, $filename),
            'docx'        => ExportService::docx($rows, $columns, $title, $subtitle, $filename),
            default       => ExportService::pdf($rows, $columns, $title, $subtitle, $filename),
        };
    }

    private function periodeToRange(string $periode): array
    {
        $now = Carbon::now();
        return match ($periode) {
            'mensuel'     => [$now->copy()->startOfMonth(), $now->copy()->endOfDay()],
            'trimestriel' => [$now->copy()->subDays(89)->startOfDay(), $now->copy()->endOfDay()],
            'semestriel'  => [$now->copy()->subDays(179)->startOfDay(), $now->copy()->endOfDay()],
            'annuel'      => [$now->copy()->startOfYear(), $now->copy()->endOfDay()],
            default       => [$now->copy()->startOfMonth(), $now->copy()->endOfDay()],
        };
    }

    private function tableauBord(string $entrepriseId, Carbon $from, Carbon $to): array
    {
        $caTotal = (float) DB::table('payements')
            ->where('entreprise', $entrepriseId)
            ->where('actif', true)
            ->whereBetween('date_payement', [$from, $to])
            ->sum('montant');

        $depenses = (float) DB::table('depenses')
            ->where('entreprise', $entrepriseId)
            ->whereBetween('date_depense', [$from, $to])
            ->sum('montant');

        $entrees = (float) DB::table('entrees_argent')
            ->where('entreprise', $entrepriseId)
            ->whereBetween('date_entree', [$from, $to])
            ->sum('montant');

        $salaires = (float) DB::table('salaires')
            ->where('entreprise', $entrepriseId)
            ->where('statut', 'paye')
            ->whereBetween('date_fin', [$from, $to])
            ->sum('montant');

        $nbCommandes = DB::table('commandes')
            ->where('entreprise', $entrepriseId)
            ->where('actif', true)
            ->whereBetween('date_commande', [$from, $to])
            ->count();

        $nbClients = DB::table('commandes')
            ->where('entreprise', $entrepriseId)
            ->where('actif', true)
            ->whereBetween('date_commande', [$from, $to])
            ->distinct('client')
            ->count('client');

        $totalSorties = $depenses + $salaires;
        $balance      = $caTotal + $entrees - $totalSorties;

        $rows = [
            ['indicateur' => 'Chiffre d\'affaires (paiements)', 'valeur' => ExportService::fmtMontant($caTotal)],
            ['indicateur' => 'Entrées diverses',                 'valeur' => ExportService::fmtMontant($entrees)],
            ['indicateur' => 'Dépenses opérationnelles',         'valeur' => ExportService::fmtMontant($depenses)],
            ['indicateur' => 'Masse salariale payée',            'valeur' => ExportService::fmtMontant($salaires)],
            ['indicateur' => 'Total sorties',                    'valeur' => ExportService::fmtMontant($totalSorties)],
            ['indicateur' => 'Balance nette',                    'valeur' => ExportService::fmtMontant($balance)],
            ['indicateur' => 'Commandes sur la période',         'valeur' => $nbCommandes],
            ['indicateur' => 'Clients actifs',                   'valeur' => $nbClients],
        ];

        return [$rows, ['indicateur' => 'Indicateur', 'valeur' => 'Valeur'], 'Tableau de Bord Financier'];
    }

    private function grandLivre(string $entrepriseId, Carbon $from, Carbon $to): array
    {
        $rows = DB::table('mouvements_financiers as mf')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'mf.utilisateur_id')
            ->where('mf.entreprise_id', $entrepriseId)
            ->whereBetween('mf.date_operation', [$from, $to])
            ->orderBy('mf.date_operation')
            ->select([
                'mf.date_operation', 'mf.type_operation', 'mf.sens', 'mf.montant', 'mf.description',
                DB::raw("CONCAT(u.name, ' ', u.prename) as utilisateur"),
            ])
            ->get()
            ->map(fn($r) => [
                'date'        => ExportService::fmtDatetime($r->date_operation),
                'type'        => ucfirst(str_replace('_', ' ', $r->type_operation)),
                'sens'        => ucfirst($r->sens),
                'montant'     => ExportService::fmtMontant($r->montant),
                'description' => $r->description ?? '—',
                'utilisateur' => $r->utilisateur,
            ])
            ->toArray();

        $columns = [
            'date'        => 'Date',
            'type'        => 'Type',
            'sens'        => 'Sens',
            'montant'     => 'Montant',
            'description' => 'Description',
            'utilisateur' => 'Utilisateur',
        ];
        return [$rows, $columns, 'Grand Livre — Journal Financier'];
    }

    private function bilanSalaires(string $entrepriseId, Carbon $from, Carbon $to): array
    {
        $rows = DB::table('salaires as s')
            ->join('utilisateurs as u', 'u.id', '=', 's.employe')
            ->leftJoin('appartenir_entreprise as ae', function ($j) use ($entrepriseId) {
                $j->on('ae.utilisateur', '=', 's.employe')
                  ->where('ae.entreprise', '=', $entrepriseId);
            })
            ->leftJoin('roles_utilisateur as ru', 'ru.id', '=', 'ae.role')
            ->where('s.entreprise', $entrepriseId)
            ->whereBetween('s.date_fin', [$from, $to])
            ->orderByDesc('s.date_fin')
            ->select([
                's.montant', 's.date_debut', 's.date_fin', 's.statut',
                DB::raw("CONCAT(u.name, ' ', u.prename) as employe"),
                DB::raw("COALESCE(ru.libelle, '—') as poste"),
            ])
            ->get()
            ->map(fn($r) => [
                'employe'    => $r->employe,
                'poste'      => $r->poste,
                'montant'    => ExportService::fmtMontant($r->montant),
                'date_debut' => ExportService::fmtDate($r->date_debut),
                'date_fin'   => ExportService::fmtDate($r->date_fin),
                'statut'     => ucfirst($r->statut),
            ])
            ->toArray();

        $columns = [
            'employe'    => 'Employé',
            'poste'      => 'Poste',
            'montant'    => 'Montant',
            'date_debut' => 'Début période',
            'date_fin'   => 'Fin période',
            'statut'     => 'Statut',
        ];
        return [$rows, $columns, 'Bilan de la Masse Salariale'];
    }

    private function etatTresorerie(string $entrepriseId, Carbon $from, Carbon $to): array
    {
        $mouvements = DB::table('mouvements_financiers')
            ->where('entreprise_id', $entrepriseId)
            ->whereBetween('date_operation', [$from, $to])
            ->orderBy('date_operation')
            ->select(['date_operation', 'sens', 'montant'])
            ->get();

        $byMonth = [];
        foreach ($mouvements as $m) {
            $key = Carbon::parse($m->date_operation)->format('Y-m');
            $byMonth[$key] ??= ['entrees' => 0.0, 'sorties' => 0.0];
            if ($m->sens === 'credit') {
                $byMonth[$key]['entrees'] += (float) $m->montant;
            } else {
                $byMonth[$key]['sorties'] += (float) $m->montant;
            }
        }

        $cumul = 0.0;
        $rows  = [];
        foreach ($byMonth as $mois => $data) {
            $cumul += $data['entrees'] - $data['sorties'];
            $rows[] = [
                'periode' => Carbon::createFromFormat('Y-m', $mois)->format('m/Y'),
                'entrees' => ExportService::fmtMontant($data['entrees']),
                'sorties' => ExportService::fmtMontant($data['sorties']),
                'solde'   => ExportService::fmtMontant($cumul),
            ];
        }

        $columns = [
            'periode' => 'Période',
            'entrees' => 'Entrées',
            'sorties' => 'Sorties',
            'solde'   => 'Solde cumulé',
        ];
        return [$rows, $columns, 'État de Trésorerie'];
    }

    private function rapportDepenses(string $entrepriseId, Carbon $from, Carbon $to): array
    {
        $rows = DB::table('depenses as d')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'd.utilisateur_marque')
            ->where('d.entreprise', $entrepriseId)
            ->whereBetween('d.date_depense', [$from, $to])
            ->orderByDesc('d.date_depense')
            ->select([
                'd.raison', 'd.montant', 'd.date_depense',
                DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
            ])
            ->get()
            ->map(fn($r) => [
                'raison'         => $r->raison,
                'montant'        => ExportService::fmtMontant($r->montant),
                'date'           => ExportService::fmtDate($r->date_depense),
                'enregistre_par' => $r->enregistre_par,
            ])
            ->toArray();

        $columns = [
            'raison'         => 'Raison',
            'montant'        => 'Montant',
            'date'           => 'Date',
            'enregistre_par' => 'Enregistré par',
        ];
        return [$rows, $columns, 'Rapport des Dépenses'];
    }

    private function rapportReappro(string $entrepriseId, Carbon $from, Carbon $to): array
    {
        $rows = DB::table('ravitaillements as r')
            ->join('produits as p', 'p.id', '=', 'r.produit')
            ->leftJoin('utilisateurs as ud', 'ud.id', '=', 'r.utilisateur_demande')
            ->leftJoin('utilisateurs as uc', 'uc.id', '=', 'r.user_confirmation')
            ->where('r.entreprise', $entrepriseId)
            ->whereBetween('r.date_creation', [$from, $to])
            ->orderByDesc('r.date_creation')
            ->select([
                'r.quantite', 'r.montant_a_depenser', 'r.statut', 'r.date_creation', 'r.date_validation',
                'p.nom as produit_nom',
                DB::raw("CONCAT(ud.name, ' ', ud.prename) as demandeur"),
                DB::raw("CONCAT(uc.name, ' ', uc.prename) as confirme_par"),
            ])
            ->get()
            ->map(fn($r) => [
                'produit'       => $r->produit_nom,
                'quantite'      => $r->quantite,
                'montant'       => ExportService::fmtMontant($r->montant_a_depenser),
                'statut'        => ucfirst(str_replace('_', ' ', $r->statut)),
                'date_creation' => ExportService::fmtDate($r->date_creation),
                'date_valid'    => ExportService::fmtDate($r->date_validation),
                'demandeur'     => $r->demandeur,
                'confirme_par'  => $r->confirme_par ?? '—',
            ])
            ->toArray();

        $columns = [
            'produit'       => 'Produit',
            'quantite'      => 'Quantité',
            'montant'       => 'Montant',
            'statut'        => 'Statut',
            'date_creation' => 'Date demande',
            'date_valid'    => 'Date validation',
            'demandeur'     => 'Demandeur',
            'confirme_par'  => 'Confirmé par',
        ];
        return [$rows, $columns, 'Rapport des Réapprovisionnements'];
    }
}
