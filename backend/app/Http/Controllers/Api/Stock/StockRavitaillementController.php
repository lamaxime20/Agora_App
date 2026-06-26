<?php

namespace App\Http\Controllers\Api\Stock;

use App\Events\Stock\RavitaillementCancelled;
use App\Events\Stock\RavitaillementConfirmed;
use App\Events\Stock\RavitaillementRequested;
use App\Models\Produit;
use App\Models\Ravitaillement;
use App\Services\ExportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StockRavitaillementController extends StockBaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);
            $page       = max(1, (int) $request->query('page', 1));
            $limit      = min(100, max(1, (int) $request->query('limit', 25)));
            $statut     = $request->query('statut');
            $produitId  = $request->query('produit');
            [$dateDebut, $dateFin] = $this->daterange($request->query('dateDebut'), $request->query('dateFin'));

            $query = DB::table('ravitaillements as r')
                ->join('produits as p', 'p.id', '=', 'r.produit')
                ->leftJoin('utilisateurs as ud', 'ud.id', '=', 'r.utilisateur_demande')
                ->leftJoin('utilisateurs as uc', 'uc.id', '=', 'r.user_confirmation')
                ->leftJoin('utilisateurs as ua', 'ua.id', '=', 'r.utilisateur_annulation')
                ->where('r.entreprise', $entreprise->id);

            if ($statut) {
                $query->where('r.statut', $statut);
            }

            if ($produitId) {
                $query->where('r.produit', $produitId);
            }

            if ($dateDebut) {
                $query->where('r.date_creation', '>=', $dateDebut);
            }

            if ($dateFin) {
                $query->where('r.date_creation', '<=', $dateFin);
            }

            $total = $query->count();

            $ravitaillements = $query->orderByDesc('r.date_creation')
                ->forPage($page, $limit)
                ->select([
                    'r.id', 'r.date_creation', 'r.statut', 'r.quantite', 'r.montant_a_depenser',
                    'r.date_validation', 'r.date_execution', 'r.date_annulation', 'r.raison_annulation',
                    'p.id as produit_id', 'p.nom as produit_nom', 'p.image as produit_image',
                    'ud.id as ud_id', 'ud.name as ud_nom', 'ud.prename as ud_prenom',
                    'uc.id as uc_id', 'uc.name as uc_nom', 'uc.prename as uc_prenom',
                    'ua.id as ua_id', 'ua.name as ua_nom', 'ua.prename as ua_prenom',
                ])
                ->get()
                ->map(fn($row) => [
                    'id'                       => $row->id,
                    'date_creation'            => $row->date_creation,
                    'statut'                   => $row->statut,
                    'quantite'                 => (float) $row->quantite,
                    'montant_a_depenser'       => (float) $row->montant_a_depenser,
                    'date_validation'          => $row->date_validation,
                    'date_execution'           => $row->date_execution,
                    'date_annulation'          => $row->date_annulation,
                    'raison_annulation'        => $row->raison_annulation,
                    'produit'                  => [
                        'id'    => $row->produit_id,
                        'nom'   => $row->produit_nom,
                        'image' => $row->produit_image,
                    ],
                    'utilisateur_demande'      => $row->ud_id ? [
                        'id'    => $row->ud_id,
                        'nom'   => $row->ud_nom,
                        'prenom'=> $row->ud_prenom,
                    ] : null,
                    'utilisateur_confirmation' => $row->uc_id ? [
                        'id'    => $row->uc_id,
                        'nom'   => $row->uc_nom,
                        'prenom'=> $row->uc_prenom,
                    ] : null,
                    'utilisateur_annulation'   => $row->ua_id ? [
                        'id'    => $row->ua_id,
                        'nom'   => $row->ua_nom,
                        'prenom'=> $row->ua_prenom,
                    ] : null,
                ]);

            return response()->json([
                'data' => [
                    'ravitaillements' => $ravitaillements,
                    'total'           => $total,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'index']);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'produit_id'         => 'required|uuid',
                'quantite'           => 'required|numeric|min:0.01',
                'montant_a_depenser' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

            $entreprise = $this->currentEntreprise($request);
            $user       = $this->currentUser($request);

            $produit = DB::table('produits')
                ->where('id', $request->input('produit_id'))
                ->where('entreprise', $entreprise->id)
                ->where('statut', 'actif')
                ->select(['id', 'type_produit', 'nom'])
                ->first();

            if (!$produit || $produit->type_produit !== 'physique') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'PRODUCT_NOT_ALLOWED',
                    'message' => 'Le produit doit être physique et actif pour créer un ravitaillement.',
                ], 403);
            }

            $ravitaillement = Ravitaillement::create([
                'date_creation'       => now(),
                'statut'              => 'en_attente',
                'quantite'            => $request->input('quantite'),
                'montant_a_depenser'  => $request->input('montant_a_depenser'),
                'actif'               => true,
                'utilisateur_demande' => $user->id,
                'produit'             => $produit->id,
                'entreprise'          => $entreprise->id,
            ]);

            $this->history($this->productHistoryPayload(
                'creation',
                'ravitaillements',
                $ravitaillement->id,
                'Création d\'un ravitaillement.',
                null,
                $ravitaillement->statut,
                $request,
                $user,
                $entreprise->id
            ));

            event(new RavitaillementRequested(
                companyId:         $entreprise->id,
                ravitaillementId:  $ravitaillement->id,
                produitId:         $produit->id,
                produitNom:        $produit->nom,
                quantiteDemandee:  (float) $request->input('quantite'),
                demandeParUserId:  $user->id
            ));

            $ravitaillementResponse = DB::table('ravitaillements as r')
                ->join('produits as p', 'p.id', '=', 'r.produit')
                ->where('r.id', $ravitaillement->id)
                ->select([
                    'r.id', 'r.date_creation', 'r.statut', 'r.quantite', 'r.montant_a_depenser',
                    'p.id as produit_id', 'p.nom as produit_nom', 'p.image as produit_image',
                ])
                ->first();

            return response()->json([
                'data' => [
                    'ravitaillement' => $ravitaillementResponse,
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'store']);
        }
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'raison_annulation' => 'required|string|min:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

            $entreprise = $this->currentEntreprise($request);
            $user       = $this->currentUser($request);

            $ravitaillement = Ravitaillement::where('id', $id)
                ->where('entreprise', $entreprise->id)
                ->first();

            if (!$ravitaillement || !in_array($ravitaillement->statut, ['en_attente', 'en_cours'], true)) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_STATE',
                    'message' => 'Le ravitaillement ne peut pas être annulé.',
                ], 409);
            }

            $ravitaillement->update([
                'statut'                 => 'annule',
                'date_annulation'        => now(),
                'raison_annulation'      => $request->input('raison_annulation'),
                'utilisateur_annulation' => $user->id,
            ]);

            $this->history($this->productHistoryPayload(
                'annulation',
                'ravitaillements',
                $ravitaillement->id,
                'Annulation d\'un ravitaillement.',
                'en_attente',
                'annule',
                $request,
                $user,
                $entreprise->id
            ));

            $produitRow = DB::table('produits')->where('id', $ravitaillement->produit)->select(['id', 'nom'])->first();
            event(new RavitaillementCancelled(
                companyId:        $entreprise->id,
                ravitaillementId: $ravitaillement->id,
                produitId:        $ravitaillement->produit,
                produitNom:       $produitRow?->nom ?? '',
                raison:           $request->input('raison_annulation')
            ));

            $ravitaillementResponse = DB::table('ravitaillements as r')
                ->join('produits as p', 'p.id', '=', 'r.produit')
                ->where('r.id', $ravitaillement->id)
                ->select([
                    'r.id', 'r.date_creation', 'r.statut', 'r.quantite', 'r.montant_a_depenser',
                    'r.date_annulation', 'r.raison_annulation',
                    'p.id as produit_id', 'p.nom as produit_nom', 'p.image as produit_image',
                ])
                ->first();

            return response()->json([
                'data' => [
                    'ravitaillement' => $ravitaillementResponse,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'cancel', 'id' => $id]);
        }
    }

    public function confirm(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

            $entreprise = $this->currentEntreprise($request);
            $user       = $this->currentUser($request);

            if (!Hash::check($request->input('password'), $user->password_hash)) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_PASSWORD',
                    'message' => 'Mot de passe incorrect.',
                ], 422);
            }

            $ravitaillement = Ravitaillement::where('id', $id)
                ->where('entreprise', $entreprise->id)
                ->first();

            if (!$ravitaillement || !in_array($ravitaillement->statut, ['en_attente', 'en_cours'], true)) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INVALID_STATE',
                    'message' => 'Le ravitaillement ne peut pas être confirmé.',
                ], 409);
            }

            $produit = Produit::where('id', $ravitaillement->produit)
                ->where('entreprise', $entreprise->id)
                ->first();

            if (!$produit) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Produit introuvable.',
                ], 404);
            }

            DB::transaction(function () use ($request, $ravitaillement, $produit, $user, $entreprise) {
                $stockAvant = (float) $produit->stock_actuel;
                $stockApres = $stockAvant + (float) $ravitaillement->quantite;

                $produit->update([
                    'stock_actuel'      => $stockApres,
                    'date_modification' => now(),
                ]);

                $ravitaillement->update([
                    'statut'           => 'termine',
                    'date_validation'  => now(),
                    'date_execution'   => now(),
                    'user_confirmation'=> $user->id,
                ]);

                $this->history($this->productHistoryPayload(
                    'ravitaillement',
                    'produits',
                    $produit->id,
                    'Ravitaillement confirmé et stock mis à jour.',
                    (string) $stockAvant,
                    (string) $stockApres,
                    $request,
                    $user,
                    $entreprise->id
                ));

                $this->history($this->productHistoryPayload(
                    'validation_ravitaillement',
                    'ravitaillements',
                    $ravitaillement->id,
                    'Validation définitive du ravitaillement.',
                    'en_cours',
                    'termine',
                    $request,
                    $user,
                    $entreprise->id
                ));
            });

            event(new RavitaillementConfirmed(
                companyId:        $entreprise->id,
                ravitaillementId: $ravitaillement->id,
                produitId:        $produit->id,
                produitNom:       $produit->nom,
                quantiteAjoutee:  (float) $ravitaillement->quantite
            ));

            $ravitaillementResponse = DB::table('ravitaillements as r')
                ->join('produits as p', 'p.id', '=', 'r.produit')
                ->where('r.id', $ravitaillement->id)
                ->select([
                    'r.id', 'r.date_creation', 'r.statut', 'r.quantite', 'r.montant_a_depenser',
                    'r.date_validation', 'r.date_execution', 'r.user_confirmation',
                    'p.id as produit_id', 'p.nom as produit_nom', 'p.image as produit_image',
                ])
                ->first();

            return response()->json([
                'data' => [
                    'ravitaillement' => $ravitaillementResponse,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'confirm', 'id' => $id]);
        }
    }

    public function export(Request $request): Response|StreamedResponse
    {
        $entreprise = $this->currentEntreprise($request);
        $format     = strtolower($request->query('format', 'pdf'));
        $statut     = $request->query('statut');
        $produitId  = $request->query('produit');
        [$dateDebut, $dateFin] = $this->daterange($request->query('dateDebut'), $request->query('dateFin'));

        $rows    = $this->buildRavitaillementsExportRows($entreprise->id, $statut, $produitId, $dateDebut, $dateFin);
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
        $subtitle = ($dateDebut && $dateFin)
            ? 'Du ' . $dateDebut->toDateString() . ' au ' . $dateFin->toDateString()
            : 'Toutes les périodes';
        $filename = 'agora-ravitaillements-' . now()->format('Ymd-His');

        return match ($format) {
            'csv', 'xlsx' => ExportService::csv($rows, $columns, $filename),
            'docx'        => ExportService::docx($rows, $columns, 'Historique des Ravitaillements', $subtitle, $filename),
            default       => ExportService::pdf($rows, $columns, 'Historique des Ravitaillements', $subtitle, $filename),
        };
    }

    private function buildRavitaillementsExportRows(
        string $entrepriseId,
        ?string $statut,
        ?string $produitId,
        ?Carbon $from,
        ?Carbon $to
    ): array {
        $query = DB::table('ravitaillements as r')
            ->join('produits as p', 'p.id', '=', 'r.produit')
            ->leftJoin('utilisateurs as ud', 'ud.id', '=', 'r.utilisateur_demande')
            ->leftJoin('utilisateurs as uc', 'uc.id', '=', 'r.user_confirmation')
            ->where('r.entreprise', $entrepriseId);

        if ($statut) {
            $query->where('r.statut', $statut);
        }
        if ($produitId) {
            $query->where('r.produit', $produitId);
        }
        if ($from) {
            $query->where('r.date_creation', '>=', $from);
        }
        if ($to) {
            $query->where('r.date_creation', '<=', $to);
        }

        return $query
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
    }
}
