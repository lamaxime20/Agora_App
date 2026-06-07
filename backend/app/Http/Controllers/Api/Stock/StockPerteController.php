<?php

namespace App\Http\Controllers\Api\Stock;

use App\Models\PerteProduit;
use App\Models\Produit;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class StockPerteController extends StockBaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);
            $page       = max(1, (int) $request->query('page', 1));
            $limit      = min(100, max(1, (int) $request->query('limit', 25)));
            $motif      = trim((string) $request->query('motif', ''));
            [$dateDebut, $dateFin] = $this->daterange($request->query('dateDebut'), $request->query('dateFin'));

            $query = DB::table('pertes_produits as pp')
                ->join('produits as p', 'p.id', '=', 'pp.produit')
                ->leftJoin('utilisateurs as u', 'u.id', '=', 'pp.user_signale')
                ->where('pp.entreprise', $entreprise->id);

            if ($motif !== '') {
                $query->where('pp.motif_perte', 'ilike', '%' . $motif . '%');
            }

            if ($dateDebut) {
                $query->where('pp.date_perte', '>=', $dateDebut);
            }

            if ($dateFin) {
                $query->where('pp.date_perte', '<=', $dateFin);
            }

            $total = $query->count();

            $rows = $query->orderByDesc('pp.date_perte')
                ->forPage($page, $limit)
                ->select([
                    'pp.id', 'pp.quantite_perdu', 'pp.motif_perte', 'pp.date_perte',
                    'p.id as produit_id', 'p.nom as produit_nom', 'p.image as produit_image',
                    'u.id as utilisateur_id', 'u.name as utilisateur_nom', 'u.prename as utilisateur_prenom',
                ])
                ->get();

            $perteIds = $rows->pluck('id')->all();

            $annuleesSet = [];
            if (!empty($perteIds)) {
                $annuleesSet = array_flip(
                    DB::table('historiques')
                        ->where('module', 'stock')
                        ->where('table_concernee', 'pertes_produits')
                        ->whereIn('id_element', $perteIds)
                        ->where('action', 'annulation_perte')
                        ->pluck('id_element')
                        ->all()
                );
            }

            $pertes = $rows->map(fn($row) => [
                'id'             => $row->id,
                'quantite_perdu' => (float) $row->quantite_perdu,
                'motif_perte'    => $row->motif_perte,
                'date_perte'     => $row->date_perte,
                'annulable'      => !isset($annuleesSet[$row->id]) && Carbon::parse($row->date_perte)->addHours(24)->isFuture(),
                'produit'        => [
                    'id'    => $row->produit_id,
                    'nom'   => $row->produit_nom,
                    'image' => $row->produit_image,
                ],
                'utilisateur'    => $row->utilisateur_id ? [
                    'id'    => $row->utilisateur_id,
                    'nom'   => $row->utilisateur_nom,
                    'prenom'=> $row->utilisateur_prenom,
                ] : null,
                'entreprise_id'  => $entreprise->id,
            ]);

            return response()->json([
                'data' => [
                    'pertes' => $pertes,
                    'total'  => $total,
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
                'produit_id'     => 'required|uuid',
                'quantite_perdu' => 'required|numeric|min:0.01',
                'motif_perte'    => 'required|string|min:5',
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

            $produit = Produit::where('id', $request->input('produit_id'))
                ->where('entreprise', $entreprise->id)
                ->where('statut', 'actif')
                ->first();

            if (!$produit || $produit->type_produit !== 'physique') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'PRODUCT_NOT_ALLOWED',
                    'message' => 'Le produit doit être physique et actif pour enregistrer une perte.',
                ], 403);
            }

            if ((float) $produit->stock_actuel < (float) $request->input('quantite_perdu')) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'INSUFFICIENT_STOCK',
                    'message' => 'Le stock actuel est insuffisant pour enregistrer cette perte.',
                ], 409);
            }

            $perte = null;
            $stockAvant = (float) $produit->stock_actuel;
            $stockApres = $stockAvant - (float) $request->input('quantite_perdu');

            try {
                 $produit->update([
                     'stock_actuel'      => $stockApres,
                     'date_modification' => now(),
                 ]);

                 $perte = PerteProduit::create([
                     'quantite_perdu' => $request->input('quantite_perdu'),
                     'motif_perte'    => trim((string) $request->input('motif_perte')),
                     'date_perte'     => now(),
                     'user_signale'   => $user->id,
                     'produit'        => $produit->id,
                     'entreprise'     => $entreprise->id,
                 ]);

                 $this->history($this->productHistoryPayload(
                     'perte',
                     'produits',
                     $produit->id,
                     'Perte enregistrée.',
                     (string) $stockAvant,
                     (string) $stockApres,
                     $request,
                     $user,
                     $entreprise->id
                 ));

                 $this->history($this->productHistoryPayload(
                     'creation',
                     'pertes_produits',
                     $perte->id,
                     'Création d\'une perte produit.',
                     null,
                     $perte->motif_perte,
                     $request,
                     $user,
                     $entreprise->id
                 ));
            } catch (\Throwable $e) {
                // Annulation manuelle en cas d'erreur
                if ($perte) {
                    $perte->delete();
                }
                $produit->update(['stock_actuel' => $stockAvant]); // Restaurer le stock
                throw $e; // Renvoyer l'exception pour qu'elle soit loggée
            }

            // TODO: créer la notification de perte pour le directeur de l'entreprise ici.

            if ((float) $produit->fresh()->stock_actuel <= (float) $produit->seuil_alerte) {
                // TODO: créer la notification de stock faible après perte ici.
            }

            $perteResponse = DB::table('pertes_produits as pp')
                ->join('produits as p', 'p.id', '=', 'pp.produit')
                ->where('pp.id', $perte->id)
                ->select([
                    'pp.id', 'pp.quantite_perdu', 'pp.motif_perte', 'pp.date_perte',
                    'p.id as produit_id', 'p.nom as produit_nom', 'p.image as produit_image',
                ])
                ->first();

            return response()->json([
                'data' => [
                    'perte' => $perteResponse,
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'store']);
        }
    }

    public function destroy(Request $request, string $id): JsonResponse
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

            $perte = PerteProduit::where('id', $id)
                ->where('entreprise', $entreprise->id)
                ->first();

            if (!$perte) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Perte introuvable.',
                ], 404);
            }

            $isAnnulable = Carbon::parse($perte->date_perte)->addHours(24)->isFuture()
                && !DB::table('historiques')
                    ->where('module', 'stock')
                    ->where('table_concernee', 'pertes_produits')
                    ->where('id_element', $perte->id)
                    ->where('action', 'annulation_perte')
                    ->exists();

            if (!$isAnnulable) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_CANCELABLE',
                    'message' => 'La perte ne peut plus être annulée.',
                ], 409);
            }

            $produit = Produit::where('id', $perte->produit)
                ->where('entreprise', $entreprise->id)
                ->first();

            if (!$produit) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Produit introuvable.',
                ], 404);
            }

            DB::transaction(function () use ($request, $perte, $produit, $user, $entreprise) {
                $stockAvant = (float) $produit->stock_actuel;
                $stockApres = $stockAvant + (float) $perte->quantite_perdu;

                $produit->update([
                    'stock_actuel'      => $stockApres,
                    'date_modification' => now(),
                ]);

                $this->history($this->productHistoryPayload(
                    'annulation_perte',
                    'produits',
                    $produit->id,
                    'Annulation d\'une perte et restauration du stock.',
                    (string) $stockAvant,
                    (string) $stockApres,
                    $request,
                    $user,
                    $entreprise->id
                ));

                $this->history($this->productHistoryPayload(
                    'annulation_perte',
                    'pertes_produits',
                    $perte->id,
                    'Annulation de la perte produit.',
                    $perte->motif_perte,
                    'annulée',
                    $request,
                    $user,
                    $entreprise->id
                ));

                $perte->delete();
            });

            return response()->json([
                'message' => 'Perte annulée, stock restauré',
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'destroy', 'id' => $id]);
        }
    }
}
