<?php

namespace App\Http\Controllers\Api\Finances;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use App\Models\Historique;
use App\Models\Utilisateur;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

abstract class FinancesBaseController extends Controller
{
    protected function financesErrorResponse(\Throwable $e, Request $request, string $method, array $context = []): JsonResponse
    {
        $payload = array_merge([
            'method'        => $method,
            'url'           => $request->fullUrl(),
            'user_id'       => $request->attributes->get('authorizedUser')?->id ?? null,
            'entreprise_id' => $request->attributes->get('currentEntreprise')?->id ?? null,
        ], $context);

        Log::error('Erreur module finances', [
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
            'code'    => 'FINANCES_INTERNAL_ERROR',
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

    /**
     * Génère le numéro de commande lisible au format CMD-{ANNÉE}-{SÉQUENCE 5 chiffres}.
     * Basé sur le rang de la commande parmi toutes les commandes de la même entreprise
     * et de la même année, triées par date_commande puis par id.
     */
    protected function numeroCommandeRaw(): \Illuminate\Database\Query\Expression
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
     * Insère un enregistrement dans la table historiques.
     */
    protected function history(
        string $module,
        string $tableConcernee,
        string $idElement,
        string $action,
        Request $request,
        string $utilisateurId,
        string $entrepriseId,
        ?string $details = null,
        ?string $ancienneValeur = null,
        ?string $nouvelleValeur = null
    ): void {
        Historique::create([
            'module'          => $module,
            'table_concernee' => $tableConcernee,
            'id_element'      => $idElement,
            'action'          => $action,
            'details_action'  => $details,
            'ancienne_valeur' => $ancienneValeur,
            'nouvelle_valeur' => $nouvelleValeur,
            'ip'              => $request->ip(),
            'user_agent'      => $request->userAgent(),
            'date_action'     => now(),
            'utilisateur'     => $utilisateurId,
            'entreprise'      => $entrepriseId,
        ]);
    }

    /**
     * Insère un mouvement financier dans la table mouvements_financiers.
     */
    protected function creerMouvementFinancier(
        string $typeOperation,
        string $sens,
        float $montant,
        string $entrepriseId,
        string $utilisateurId,
        ?string $referenceId = null,
        ?string $description = null
    ): string {
        $id = (string) Str::uuid();

        DB::table('mouvements_financiers')->insert([
            'id'             => $id,
            'date_operation' => now(),
            'type_operation' => $typeOperation,
            'montant'        => $montant,
            'sens'           => $sens,
            'reference_id'   => $referenceId,
            'description'    => $description,
            'entreprise_id'  => $entrepriseId,
            'utilisateur_id' => $utilisateurId,
        ]);

        return $id;
    }

    /**
     * Retourne les bornes de date à partir de paramètres optionnels date_debut / date_fin.
     */
    protected function daterange(?string $start, ?string $end): array
    {
        $from = $start ? Carbon::parse($start)->startOfDay() : null;
        $to   = $end   ? Carbon::parse($end)->endOfDay()     : null;

        return [$from, $to];
    }

    /**
     * Applique les filtres de plage de dates sur une colonne donnée.
     */
    protected function applyDaterange(\Illuminate\Database\Query\Builder $query, string $column, ?Carbon $from, ?Carbon $to): \Illuminate\Database\Query\Builder
    {
        if ($from) {
            $query->where($column, '>=', $from);
        }
        if ($to) {
            $query->where($column, '<=', $to);
        }

        return $query;
    }
}
