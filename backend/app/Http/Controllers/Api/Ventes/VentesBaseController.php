<?php

namespace App\Http\Controllers\Api\Ventes;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use App\Models\Historique;
use App\Models\Utilisateur;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Query\Expression;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

abstract class VentesBaseController extends Controller
{
    protected function ventesErrorResponse(\Throwable $e, Request $request, string $method, array $context = []): JsonResponse
    {
        $payload = array_merge([
            'method'        => $method,
            'url'           => $request->fullUrl(),
            'user_id'       => $request->attributes->get('authorizedUser')?->id ?? null,
            'entreprise_id' => $request->attributes->get('currentEntreprise')?->id ?? null,
        ], $context);

        Log::error('Erreur module ventes', [
            'message'   => $e->getMessage(),
            'exception' => get_class($e),
            'file'      => $e->getFile(),
            'line'      => $e->getLine(),
            'trace'     => collect($e->getTrace())->take(10)->toArray(),
            'context'   => $payload,
        ]);

        report($e);

        return response()->json([
            'ok'      => false,
            'code'    => 'VENTES_INTERNAL_ERROR',
            'message' => 'Une erreur est survenue côté serveur.',
        ], 500);
    }

    protected function currentUser(Request $request): Utilisateur
    {
        /** @var Utilisateur $user */
        return $request->attributes->get('authorizedUser');
    }

    protected function currentEntreprise(Request $request): Entreprise
    {
        /** @var Entreprise $entreprise */
        return $request->attributes->get('currentEntreprise');
    }

    protected function currentRoleId(Request $request): string
    {
        return (string) $request->attributes->get('currentRole')?->id;
    }

    protected function history(
        string $module,
        string $tableConcernee,
        string $idElement,
        string $action,
        Request $request,
        string $utilisateurId,
        string $entrepriseId,
        ?string $details = null
    ): void {
        Historique::create([
            'module'          => $module,
            'table_concernee' => $tableConcernee,
            'id_element'      => $idElement,
            'action'          => $action,
            'details_action'  => $details,
            'ip'              => $request->ip(),
            'user_agent'      => $request->userAgent(),
            'date_action'     => now(),
            'utilisateur'     => $utilisateurId,
            'entreprise'      => $entrepriseId,
        ]);
    }

    /**
     * Génère le numéro de commande lisible : CMD-{ANNÉE}-{SÉQUENCE 5 chiffres}.
     * Requiert que la table commandes soit aliasée "c" dans la requête courante.
     */
    protected function numeroCommandeRaw(): Expression
    {
        return DB::raw(
            "CONCAT('CMD-', EXTRACT(YEAR FROM c.date_commande)::int, '-', " .
            "LPAD((" .
            "SELECT COUNT(c2.id) FROM commandes c2 " .
            "WHERE c2.entreprise = c.entreprise " .
            "AND EXTRACT(YEAR FROM c2.date_commande) = EXTRACT(YEAR FROM c.date_commande) " .
            "AND (c2.date_commande < c.date_commande OR (c2.date_commande = c.date_commande AND c2.id::text <= c.id::text))" .
            ")::text, 5, '0')) as numero"
        );
    }

    /**
     * Expression SQL calculant le stock_reserve d'un produit (alias p)
     * pour une entreprise : quantités engagées dans des commandes validées non encore livrées.
     */
    protected function stockReserveRaw(string $entrepriseId): Expression
    {
        return DB::raw(
            "(SELECT COALESCE(SUM(cp_r.quantite), 0) " .
            "FROM contenir_produit cp_r " .
            "JOIN commandes c_r ON c_r.id = cp_r.commande_id " .
            "WHERE cp_r.produit_id = p.id " .
            "AND c_r.statut = 'validee' " .
            "AND c_r.entreprise = '" . $entrepriseId . "' " .
            "AND NOT EXISTS (" .
            "SELECT 1 FROM livraisons l_r WHERE l_r.commande = c_r.id AND l_r.statut = 'livree'" .
            ")) as stock_reserve"
        );
    }

    /**
     * Calcule le stock_reserve pour un produit spécifique via la query builder PHP.
     */
    protected function getStockReserve(string $produitId, string $entrepriseId): float
    {
        return (float) DB::table('contenir_produit as cp')
            ->join('commandes as cr', 'cr.id', '=', 'cp.commande_id')
            ->where('cp.produit_id', $produitId)
            ->where('cr.statut', 'validee')
            ->where('cr.entreprise', $entrepriseId)
            ->whereNotExists(function ($q) {
                $q->selectRaw('1')
                    ->from('livraisons as lv')
                    ->whereRaw('lv.commande = cr.id')
                    ->where('lv.statut', 'livree');
            })
            ->sum('cp.quantite');
    }

    /**
     * Retourne le statut métier affiché d'une commande selon son statut DB et ses livraisons.
     */
    protected function calculerStatutMetier(string $statutDb, bool $aLivraisonLivree, bool $aLivraisonEnCours): string
    {
        return match (true) {
            $statutDb === 'brouillon'                          => 'reçu',
            $statutDb === 'annulee'                            => 'annulé',
            $statutDb === 'validee' && $aLivraisonLivree       => 'livré',
            $statutDb === 'validee' && $aLivraisonEnCours      => 'en cours de livraison',
            $statutDb === 'validee'                            => 'validé',
            default                                            => $statutDb,
        };
    }

    /**
     * Applique le filtre statut métier sur la query (commandes aliasée "c").
     */
    protected function applyStatutFilter(Builder $query, string $statut): void
    {
        match ($statut) {
            'reçu'  => $query->where('c.statut', 'brouillon'),
            'annulé'=> $query->where('c.statut', 'annulee'),
            'livré' => $query->where('c.statut', 'validee')
                             ->whereExists(function ($q) {
                                 $q->selectRaw('1')->from('livraisons as lf')
                                   ->whereRaw('lf.commande = c.id')
                                   ->where('lf.statut', 'livree');
                             }),
            'en cours de livraison' => $query->where('c.statut', 'validee')
                             ->whereExists(function ($q) {
                                 $q->selectRaw('1')->from('livraisons as lf')
                                   ->whereRaw('lf.commande = c.id')
                                   ->where('lf.statut', 'en_cours');
                             }),
            'validé'=> $query->where('c.statut', 'validee')
                             ->whereNotExists(function ($q) {
                                 $q->selectRaw('1')->from('livraisons as lf')
                                   ->whereRaw('lf.commande = c.id')
                                   ->whereIn('lf.statut', ['en_cours', 'livree']);
                             }),
            default => null,
        };
    }

    protected function daterange(?string $start, ?string $end): array
    {
        $from = $start ? Carbon::parse($start)->startOfDay() : null;
        $to   = $end   ? Carbon::parse($end)->endOfDay()     : null;
        return [$from, $to];
    }
}
