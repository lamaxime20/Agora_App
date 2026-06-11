<?php

namespace App\Http\Controllers\Api\Livraisons;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use App\Models\Historique;
use App\Models\Utilisateur;
use Carbon\Carbon;
use Illuminate\Database\Query\Expression;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

abstract class LivraisonsBaseController extends Controller
{
    protected function livraisonsErrorResponse(\Throwable $e, Request $request, string $method, array $context = []): JsonResponse
    {
        $payload = array_merge([
            'method'        => $method,
            'url'           => $request->fullUrl(),
            'user_id'       => $request->attributes->get('authorizedUser')?->id ?? null,
            'entreprise_id' => $request->attributes->get('currentEntreprise')?->id ?? null,
        ], $context);

        Log::error('Erreur module livraisons', [
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
            'code'    => 'LIVRAISONS_INTERNAL_ERROR',
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

    protected function daterange(?string $start, ?string $end): array
    {
        $from = $start ? Carbon::parse($start)->startOfDay() : null;
        $to   = $end   ? Carbon::parse($end)->endOfDay()     : null;
        return [$from, $to];
    }

    /**
     * Expression SQL pour le numéro LIV-{ANNÉE}-{SÉQUENCE}.
     * Requiert : livraisons aliasée "l", commandes aliasée "c".
     */
    protected function numeroLivraisonRaw(string $entrepriseId): Expression
    {
        return DB::raw(
            "CONCAT('LIV-', EXTRACT(YEAR FROM l.date_creation)::int, '-', " .
            "LPAD((" .
            "SELECT COUNT(l2.id) FROM livraisons l2 " .
            "JOIN commandes c2_liv ON c2_liv.id = l2.commande " .
            "WHERE c2_liv.entreprise = '" . $entrepriseId . "' " .
            "AND EXTRACT(YEAR FROM l2.date_creation) = EXTRACT(YEAR FROM l.date_creation) " .
            "AND (l2.date_creation < l.date_creation " .
            "  OR (l2.date_creation = l.date_creation AND l2.id::text <= l.id::text))" .
            ")::text, 5, '0')) as numero_liv"
        );
    }

    /**
     * Expression SQL pour le numéro CMD-{ANNÉE}-{SÉQUENCE}.
     * Requiert : commandes aliasée "c".
     */
    protected function numeroCommandeRaw(): Expression
    {
        return DB::raw(
            "CONCAT('CMD-', EXTRACT(YEAR FROM c.date_commande)::int, '-', " .
            "LPAD((" .
            "SELECT COUNT(c2.id) FROM commandes c2 " .
            "WHERE c2.entreprise = c.entreprise " .
            "AND EXTRACT(YEAR FROM c2.date_commande) = EXTRACT(YEAR FROM c.date_commande) " .
            "AND (c2.date_commande < c.date_commande " .
            "  OR (c2.date_commande = c.date_commande AND c2.id::text <= c.id::text))" .
            ")::text, 5, '0')) as numero_cmd"
        );
    }

    /**
     * Calcule le numéro LIV d'une livraison donnée (appel PHP).
     */
    protected function calcNumeroLivraison(string $livraisonId, string $entrepriseId): string
    {
        $row = DB::table('livraisons')->where('id', $livraisonId)->select(['date_creation'])->first();
        if (!$row) {
            return 'LIV-????-?????';
        }

        $year = Carbon::parse($row->date_creation)->year;

        $seq = DB::table('livraisons as l2')
            ->join('commandes as c2', 'c2.id', '=', 'l2.commande')
            ->where('c2.entreprise', $entrepriseId)
            ->whereRaw("EXTRACT(YEAR FROM l2.date_creation) = ?", [$year])
            ->where(function ($q) use ($row, $livraisonId) {
                $q->where('l2.date_creation', '<', $row->date_creation)
                  ->orWhere(function ($q2) use ($row, $livraisonId) {
                      $q2->where('l2.date_creation', '=', $row->date_creation)
                         ->whereRaw("l2.id::text <= ?", [$livraisonId]);
                  });
            })
            ->count();

        return 'LIV-' . $year . '-' . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Calcule le numéro CMD d'une commande donnée (appel PHP).
     */
    protected function calcNumeroCommande(string $commandeId): string
    {
        $row = DB::table('commandes')->where('id', $commandeId)->select(['date_commande', 'entreprise'])->first();
        if (!$row) {
            return 'CMD-????-?????';
        }

        $year = Carbon::parse($row->date_commande)->year;

        $seq = DB::table('commandes as c2')
            ->where('c2.entreprise', $row->entreprise)
            ->whereRaw("EXTRACT(YEAR FROM c2.date_commande) = ?", [$year])
            ->where(function ($q) use ($row, $commandeId) {
                $q->where('c2.date_commande', '<', $row->date_commande)
                  ->orWhere(function ($q2) use ($row, $commandeId) {
                      $q2->where('c2.date_commande', '=', $row->date_commande)
                         ->whereRaw("c2.id::text <= ?", [$commandeId]);
                  });
            })
            ->count();

        return 'CMD-' . $year . '-' . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Retourne la collection des utilisateurs actifs d'un rôle dans l'entreprise.
     * Chaque objet a : id, role_id.
     */
    protected function getUsersByRole(string $entrepriseId, string $roleSlug): \Illuminate\Support\Collection
    {
        return DB::table('appartenir_entreprise as ae')
            ->join('roles_utilisateur as ru', 'ru.id', '=', 'ae.role_utilisateur_id')
            ->where('ae.entreprise_id', $entrepriseId)
            ->where('ae.statut', 'actif')
            ->where('ru.role', $roleSlug)
            ->select(['ae.utilisateur_id as id', 'ae.role_utilisateur_id as role_id'])
            ->get();
    }
}
