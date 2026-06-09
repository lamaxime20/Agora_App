<?php

namespace App\Http\Controllers\Api\Ventes;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class VentesClientController extends VentesBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 1 — GET /api/ventes/clients
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste paginée des clients avec nombre de commandes et CA total.
     *
     * Query params : page, per_page, recherche
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $page      = max(1, (int) $request->query('page', 1));
            $perPage   = min(100, max(1, (int) $request->query('per_page', 20)));
            $recherche = trim((string) $request->query('recherche', ''));

            $query = DB::table('clients as cl')
                ->where('cl.entreprise', $entrepriseId)
                ->selectRaw(
                    "cl.id, cl.nom, cl.prenom, cl.email, cl.telephone," .
                    "(SELECT COUNT(c.id) FROM commandes c WHERE c.client = cl.id) as commandes," .
                    "(SELECT COALESCE(SUM(p.montant), 0) FROM payements p " .
                    "JOIN commandes c ON c.id = p.commande " .
                    "WHERE c.client = cl.id AND p.entreprise = '" . $entrepriseId . "' AND p.actif = TRUE) as ca_total"
                );

            if ($recherche !== '') {
                $query->where(function ($q) use ($recherche) {
                    $q->where('cl.nom', 'ilike', '%' . $recherche . '%')
                        ->orWhere('cl.prenom', 'ilike', '%' . $recherche . '%')
                        ->orWhere('cl.email', 'ilike', '%' . $recherche . '%')
                        ->orWhere('cl.telephone', 'ilike', '%' . $recherche . '%');
                });
            }

            $total = $query->count();

            $data = $query
                ->orderBy('cl.nom', 'asc')
                ->forPage($page, $perPage)
                ->get()
                ->map(fn($row) => [
                    'id'        => $row->id,
                    'nom'       => $row->nom,
                    'prenom'    => $row->prenom,
                    'email'     => $row->email,
                    'telephone' => $row->telephone,
                    'commandes' => (int) $row->commandes,
                    'ca_total'  => (float) $row->ca_total,
                ]);

            return response()->json([
                'data' => $data,
                'meta' => ['page' => $page, 'per_page' => $perPage, 'total' => $total],
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 2 — GET /api/ventes/clients/{id}
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Détail d'un client : résumé financier + 10 dernières commandes.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $client = DB::table('clients')
                ->where('id', $id)
                ->where('entreprise', $entrepriseId)
                ->first();

            if (!$client) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Client introuvable.',
                ], 404);
            }

            $resume = DB::table('commandes as c')
                ->where('c.client', $id)
                ->where('c.entreprise', $entrepriseId)
                ->selectRaw(
                    "COUNT(c.id) as total_commandes," .
                    "MAX(c.date_commande) as derniere_commande," .
                    "(SELECT COALESCE(SUM(p.montant), 0) FROM payements p " .
                    "JOIN commandes c2 ON c2.id = p.commande " .
                    "WHERE c2.client = '" . $id . "' AND p.entreprise = '" . $entrepriseId . "' AND p.actif = TRUE) as ca_total"
                )
                ->first();

            $totalCommandes  = (int) ($resume->total_commandes ?? 0);
            $caTotal         = (float) ($resume->ca_total ?? 0);
            $commandeMoyenne = $totalCommandes > 0 ? round($caTotal / $totalCommandes, 2) : 0;

            $commandes = DB::table('commandes as c')
                ->where('c.client', $id)
                ->where('c.entreprise', $entrepriseId)
                ->orderBy('c.date_commande', 'desc')
                ->limit(10)
                ->select([
                    'c.id',
                    'c.statut',
                    'c.montant_commande',
                    'c.date_commande',
                    $this->numeroCommandeRaw(),
                    DB::raw("(SELECT COUNT(1) FROM livraisons lv WHERE lv.commande = c.id AND lv.statut = 'livree') > 0 as a_livraison_livree"),
                    DB::raw("(SELECT COUNT(1) FROM livraisons lv WHERE lv.commande = c.id AND lv.statut = 'en_cours') > 0 as a_livraison_en_cours"),
                ])
                ->get()
                ->map(fn($row) => [
                    'id'     => $row->id,
                    'numero' => $row->numero,
                    'date'   => substr($row->date_commande, 0, 10),
                    'statut' => $this->calculerStatutMetier($row->statut, (bool) $row->a_livraison_livree, (bool) $row->a_livraison_en_cours),
                    'montant'=> (float) $row->montant_commande,
                ]);

            return response()->json([
                'client'             => [
                    'id'           => $client->id,
                    'nom'          => $client->nom,
                    'prenom'       => $client->prenom,
                    'email'        => $client->email,
                    'telephone'    => $client->telephone,
                    'date_creation'=> null,
                ],
                'resume'             => [
                    'total_commandes'  => $totalCommandes,
                    'ca_total'         => $caTotal,
                    'commande_moyenne' => $commandeMoyenne,
                    'derniere_commande'=> $resume->derniere_commande ? substr($resume->derniere_commande, 0, 10) : null,
                ],
                'dernieres_commandes'=> $commandes,
            ], 200);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__, ['client_id' => $id]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 3 — POST /api/ventes/clients
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Crée un nouveau client pour l'entreprise.
     *
     * Body JSON : nom (requis), prenom, email, telephone
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nom'       => 'required|string|max:255',
                'prenom'    => 'nullable|string|max:255',
                'email'     => 'nullable|email|max:255',
                'telephone' => 'nullable|string|max:50',
            ], [
                'nom.required' => 'Le nom est requis.',
                'email.email'  => 'Le format de l\'adresse e-mail est invalide.',
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

            if ($request->filled('email')) {
                $exists = DB::table('clients')
                    ->where('email', $request->input('email'))
                    ->where('entreprise', $entrepriseId)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'ok'      => false,
                        'code'    => 'DUPLICATE_EMAIL',
                        'message' => 'Un client avec cet email existe déjà.',
                    ], 409);
                }
            }

            $clientId = (string) Str::uuid();

            DB::table('clients')->insert([
                'id'        => $clientId,
                'nom'       => $request->input('nom'),
                'prenom'    => $request->input('prenom'),
                'email'     => $request->input('email'),
                'telephone' => $request->input('telephone'),
                'entreprise'=> $entrepriseId,
            ]);

            $this->history(
                'ventes', 'clients', $clientId,
                'création client',
                $request, $user->id, $entrepriseId
            );

            return response()->json([
                'client' => [
                    'id'        => $clientId,
                    'nom'       => $request->input('nom'),
                    'prenom'    => $request->input('prenom'),
                    'email'     => $request->input('email'),
                    'telephone' => $request->input('telephone'),
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->ventesErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 4 — GET /api/ventes/clients/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export des clients en PDF, CSV ou DOCX.
     *
     * Query params : format (pdf|csv|docx), recherche
     */
    public function export(Request $request): JsonResponse
    {
        $format = $request->query('format', 'pdf');

        // TODO: Implémenter la génération de fichier PDF / CSV / DOCX ($format).
        // Même logique que index() sans pagination.
        // Colonnes : nom, prénom, email, téléphone, nombre de commandes, CA total.
        // Insérer dans historiques : action = 'export clients', details_action = $format.
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => "Export {$format} non encore implémenté.",
        ], 501);
    }
}
