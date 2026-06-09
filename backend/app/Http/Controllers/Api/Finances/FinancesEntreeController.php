<?php

namespace App\Http\Controllers\Api\Finances;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FinancesEntreeController extends FinancesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 17 — GET /api/finances/entrees
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des entrées d'argent de l'entreprise.
     *
     * Query params : page, per_page, recherche, date_debut, date_fin
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche = trim((string) $request->query('recherche', ''));
            $dateDebut = $request->query('date_debut');
            $dateFin   = $request->query('date_fin');

            [$from, $to] = $this->daterange($dateDebut, $dateFin);

            $query = DB::table('entrees_argent as e')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'e.utilisateur_marque')
                ->where('e.entreprise', $entrepriseId)
                ->where('e.actif', true);

            if ($recherche !== '') {
                $query->where('e.raison', 'ilike', '%' . $recherche . '%');
            }

            if ($from) {
                $query->where('e.date_entree', '>=', $from);
            }
            if ($to) {
                $query->where('e.date_entree', '<=', $to);
            }

            $total = $query->count();

            $data = $query
                ->orderBy('e.date_entree', 'desc')
                ->forPage($page, $perPage)
                ->select([
                    'e.id',
                    'e.montant',
                    'e.raison',
                    'e.date_entree',
                    DB::raw("CONCAT(u.name, ' ', u.prename) as enregistre_par"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'            => $row->id,
                    'montant'       => (float) $row->montant,
                    'raison'        => $row->raison,
                    'date_entree'   => substr($row->date_entree, 0, 10),
                    'enregistre_par'=> $row->enregistre_par,
                ]);

            return response()->json([
                'data' => $data,
                'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total],
            ], 200);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 18 — POST /api/finances/entrees
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Enregistre une nouvelle entrée d'argent.
     *
     * Body JSON : montant, date_entree, raison
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'montant'     => 'required|numeric|min:0.01',
                'date_entree' => 'required|date',
                'raison'      => 'required|string|max:1000',
            ], [
                'montant.required'     => 'Le montant est requis.',
                'montant.min'          => 'Le montant doit être supérieur à 0.',
                'date_entree.required' => "La date de l'entrée est requise.",
                'date_entree.date'     => "La date de l'entrée est invalide.",
                'raison.required'      => 'La raison est requise.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

            $entreprise   = $this->currentEntreprise($request);
            $user         = $this->currentUser($request);
            $entrepriseId = $entreprise->id;
            $montant      = (float) $request->input('montant');
            $raison       = $request->input('raison');
            $dateEntree   = $request->input('date_entree');

            $entreeId = (string) Str::uuid();

            DB::table('entrees_argent')->insert([
                'id'                => $entreeId,
                'montant'           => $montant,
                'raison'            => $raison,
                'date_entree'       => $dateEntree,
                'entreprise'        => $entrepriseId,
                'utilisateur_marque'=> $user->id,
                'actif'             => true,
            ]);

            // Augmenter l'argent virtuel de l'entreprise
            DB::table('entreprises')
                ->where('id', $entrepriseId)
                ->increment('argent_virtuel', $montant);

            // Mouvement financier
            $this->creerMouvementFinancier(
                'entree_generale',
                'entree',
                $montant,
                $entrepriseId,
                $user->id,
                $entreeId,
                $raison
            );

            $this->history(
                'finances', 'entrees_argent', $entreeId,
                'entrée enregistrée',
                $request, $user->id, $entrepriseId
            );

            return response()->json([
                'entree' => [
                    'id'          => $entreeId,
                    'montant'     => $montant,
                    'raison'      => $raison,
                    'date_entree' => substr($dateEntree, 0, 10),
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->financesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 19 — GET /api/finances/entrees/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des entrées filtrées en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), + mêmes filtres que route 17
     */
    public function export(Request $request): JsonResponse
    {
        // TODO: Implémenter la génération de fichier PDF / CSV / DOCX.
        // Même logique que index() sans pagination.
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => 'Export non encore implémenté.',
        ], 501);
    }
}
