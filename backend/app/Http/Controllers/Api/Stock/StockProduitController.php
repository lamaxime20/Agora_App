<?php

namespace App\Http\Controllers\Api\Stock;

use App\Models\CategorieProduit;
use App\Models\Historique;
use App\Models\PerteProduit;
use App\Models\Produit;
use App\Models\Ravitaillement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class StockProduitController extends StockBaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);
        $reservedMap = $this->reservedQuantitiesByProduct($entreprise->id);

        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 25)));
        $search = trim((string) $request->query('search', ''));
        $categorie = $request->query('categorie');
        $typeProduit = $request->query('type_produit');
        $statut = $request->query('statut');

        $query = Produit::query()
            ->with('categorie')
            ->where('entreprise', $entreprise->id)
            ->where('statut', $statut ?: 'actif');

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('nom', 'ilike', '%' . $search . '%')
                    ->orWhere('description', 'ilike', '%' . $search . '%');
            });
        }

        if ($categorie) {
            $query->where('categorie', $categorie);
        }

        if ($typeProduit) {
            $query->where('type_produit', $typeProduit);
        }

        $total = $query->count();
        $produits = $query->orderBy('nom')
            ->forPage($page, $limit)
            ->get()
            ->map(function (Produit $produit) use ($reservedMap) {
                $stockDisponible = $this->stockDisponible($produit, $reservedMap);

                return [
                    'id'                   => $produit->id,
                    'nom'                  => $produit->nom,
                    'image'                => $produit->image,
                    'prix_unitaire'        => (float) $produit->prix_unitaire,
                    'seuil_alerte'         => (float) $produit->seuil_alerte,
                    'type_produit'         => $produit->type_produit,
                    'stock_actuel'         => (float) $produit->stock_actuel,
                    'stock_disponible'     => $stockDisponible,
                    'unite_mesure'         => $produit->unite_mesure,
                    'description'          => $produit->description,
                    'statut'               => $produit->statut,
                    'categorie'            => $produit->categorie?->categorie,
                    'categorie_id'         => $produit->categorie?->id,
                    'statut_disponibilite'  => $this->availabilityLabel($produit, $stockDisponible),
                    'created_at'           => $produit->date_creation,
                    'updated_at'           => $produit->date_modification,
                ];
            });

            return response()->json([
                'data' => [
                    'produits' => $produits,
                    'total'    => $total,
                    'page'     => $page,
                    'limit'    => $limit,
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
            'nom'            => 'required|string|min:2|max:255',
            'prix_unitaire'  => 'required|numeric|min:0',
            'type_produit'   => 'required|in:physique,service',
            'categorie'      => 'required|uuid',
            'stock_actuel'   => 'nullable|numeric|min:0',
            'seuil_alerte'   => 'nullable|numeric|min:0',
            'unite_mesure'   => 'nullable|string|max:50',
            'description'    => 'nullable|string',
            'image'          => 'nullable|image|max:5120',
        ], [
            'categorie.uuid' => 'Identifiant de catégorie invalide.',
        ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

        $entreprise = $this->currentEntreprise($request);
        $user = $this->currentUser($request);
        $categorie = CategorieProduit::where('id', $request->input('categorie'))
            ->where('entreprise', $entreprise->id)
            ->first();

        if (!$categorie) {
            return response()->json([
                'ok'      => false,
                'code'    => 'CATEGORY_NOT_ALLOWED',
                'message' => 'Cette catégorie n\'appartient pas à votre entreprise.',
            ], 403);
        }

        $storedImagePath = null;
        $imageUrl = null;

        if ($request->hasFile('image')) {
            $storedImagePath = $request->file('image')->store('produits', 'public');
            $imageUrl = url(Storage::disk('public')->url($storedImagePath));
        }

        $stockActuel = $request->input('type_produit') === 'service'
            ? 0
            : (float) $request->input('stock_actuel', 0);

        $seuilAlerte = $request->input('type_produit') === 'service'
            ? 0
            : (float) $request->input('seuil_alerte', 0);

        $produit = Produit::create([
            'nom'             => trim((string) $request->input('nom')),
            'date_creation'   => now(),
            'image'           => $imageUrl,
            'prix_unitaire'   => $request->input('prix_unitaire'),
            'seuil_alerte'    => $seuilAlerte,
            'type_produit'    => $request->input('type_produit'),
            'stock_actuel'    => $stockActuel,
            'unite_mesure'    => $request->input('type_produit') === 'service' ? null : $request->input('unite_mesure'),
            'description'     => $request->input('description'),
            'statut'          => 'actif',
            'utilisateur'     => $user->id,
            'entreprise'      => $entreprise->id,
            'categorie'       => $categorie->id,
        ]);

        $this->history($this->productHistoryPayload(
            'creation',
            'produits',
            $produit->id,
            'Création du produit.',
            null,
            $produit->nom,
            $request,
            $user,
            $entreprise->id
        ));

        if ($produit->type_produit === 'physique' && (float) $produit->stock_actuel <= (float) $produit->seuil_alerte) {
            // TODO: créer la notification de stock faible pour le directeur de l'entreprise ici.
            // Notification::create([
            //     'titre' => 'Stock faible',
            //     'message' => 'Le produit ...',
            //     'type_notification' => 'stock',
            //     ...
            // ]);
        }

            return response()->json([
                'data' => [
                    'produit' => $produit->load('categorie'),
                ],
            ], 201);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'store']);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise = $this->currentEntreprise($request);
        $reservedMap = $this->reservedQuantitiesByProduct($entreprise->id);

        $produit = Produit::with('categorie')
            ->where('id', $id)
            ->where('entreprise', $entreprise->id)
            ->first();

        if (!$produit) {
            return response()->json([
                'ok'      => false,
                'code'    => 'NOT_FOUND',
                'message' => 'Produit introuvable.',
            ], 404);
        }

        $stockDisponible = $this->stockDisponible($produit, $reservedMap);

        $nbRavitaillements = Ravitaillement::where('produit', $produit->id)
            ->where('entreprise', $entreprise->id)
            ->count();

        $montantTotalReappro = (float) Ravitaillement::where('produit', $produit->id)
            ->where('entreprise', $entreprise->id)
            ->sum('montant_a_depenser');

        $nbPertes = PerteProduit::where('produit', $produit->id)
            ->where('entreprise', $entreprise->id)
            ->count();

        $quantitePerdueTotale = (float) PerteProduit::where('produit', $produit->id)
            ->where('entreprise', $entreprise->id)
            ->sum('quantite_perdu');

        $venteStats = DB::table('contenir_produit as cp')
            ->join('commandes as c', 'c.id', '=', 'cp.commande_id')
            ->where('cp.produit_id', $produit->id)
            ->where('c.entreprise', $entreprise->id)
            ->where('c.statut', 'validee')
            ->selectRaw('COALESCE(COUNT(DISTINCT cp.commande_id), 0) as nb_commandes, COALESCE(SUM(cp.quantite), 0) as quantite_vendue, COALESCE(SUM(cp.montant), 0) as ca_total')
            ->first();

        $evolutionStock = Historique::where('module', 'stock')
            ->where('table_concernee', 'produits')
            ->where('id_element', $produit->id)
            ->orderByDesc('date_action')
            ->limit(7)
            ->get()
            ->map(fn(Historique $historique) => [
                'date_action'      => $historique->date_action,
                'ancienne_valeur'  => $historique->ancienne_valeur,
                'nouvelle_valeur'  => $historique->nouvelle_valeur,
                'action'           => $historique->action,
            ])
            ->values();

            return response()->json([
                'data' => [
                    'produit' => [
                        'id'                   => $produit->id,
                        'nom'                  => $produit->nom,
                        'image'                => $produit->image,
                        'prix_unitaire'        => (float) $produit->prix_unitaire,
                        'seuil_alerte'         => (float) $produit->seuil_alerte,
                        'type_produit'         => $produit->type_produit,
                        'stock_actuel'         => (float) $produit->stock_actuel,
                        'stock_disponible'     => $stockDisponible,
                        'unite_mesure'         => $produit->unite_mesure,
                        'description'          => $produit->description,
                        'statut'               => $produit->statut,
                        'categorie'            => $produit->categorie ? [
                            'id'          => $produit->categorie->id,
                            'categorie'   => $produit->categorie->categorie,
                            'description' => $produit->categorie->description,
                        ] : null,
                        'statut_disponibilite' => $this->availabilityLabel($produit, $stockDisponible),
                    ],
                    'statistiques' => [
                        'nb_ravitaillements'         => $nbRavitaillements,
                        'montant_total_reappro'      => $montantTotalReappro,
                        'nb_pertes'                  => $nbPertes,
                        'quantite_perdue_totale'     => $quantitePerdueTotale,
                        'nb_ventes'                  => (int) ($venteStats->nb_commandes ?? 0),
                        'ca_total'                   => (float) ($venteStats->ca_total ?? 0),
                    ],
                    'evolution_stock_7j' => $evolutionStock,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'show', 'id' => $id]);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
            'nom'            => 'nullable|string|min:2|max:255',
            'prix_unitaire'  => 'nullable|numeric|min:0',
            'seuil_alerte'   => 'nullable|numeric|min:0',
            'unite_mesure'   => 'nullable|string|max:50',
            'description'    => 'nullable|string',
            'categorie'      => 'nullable|uuid',
            'image'          => 'nullable|image|max:5120',
        ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

        $entreprise = $this->currentEntreprise($request);
        $user = $this->currentUser($request);

        $produit = Produit::where('id', $id)
            ->where('entreprise', $entreprise->id)
            ->first();

        if (!$produit) {
            return response()->json([
                'ok'      => false,
                'code'    => 'NOT_FOUND',
                'message' => 'Produit introuvable.',
            ], 404);
        }

        $changes = [];
        $storedImagePath = null;
        $newImageUrl = null;

        if ($request->hasFile('image')) {
            $storedImagePath = $request->file('image')->store('produits', 'public');
            $newImageUrl = url(Storage::disk('public')->url($storedImagePath));
        }

        $fields = [
            'nom'           => $request->filled('nom') ? trim((string) $request->input('nom')) : null,
            'prix_unitaire' => $request->filled('prix_unitaire') ? $request->input('prix_unitaire') : null,
            'seuil_alerte'  => $request->filled('seuil_alerte') ? $request->input('seuil_alerte') : null,
            'unite_mesure'  => $request->filled('unite_mesure') ? $request->input('unite_mesure') : null,
            'description'   => $request->has('description') ? $request->input('description') : null,
            'categorie'     => $request->filled('categorie') ? $request->input('categorie') : null,
        ];

        if ($request->filled('categorie')) {
            $categorie = CategorieProduit::where('id', $request->input('categorie'))
                ->where('entreprise', $entreprise->id)
                ->first();

            if (!$categorie) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'CATEGORY_NOT_ALLOWED',
                    'message' => 'Cette catégorie n\'appartient pas à votre entreprise.',
                ], 403);
            }
        }

        DB::transaction(function () use ($request, $produit, $fields, $newImageUrl, $user, $entreprise, &$changes) {
            foreach ($fields as $field => $value) {
                if ($value === null) {
                    continue;
                }

                $oldValue = $produit->{$field};
                if ((string) $oldValue === (string) $value) {
                    continue;
                }

                $produit->{$field} = $value;
                $changes[$field] = [$oldValue, $value];
            }

            if ($newImageUrl) {
                $oldValue = $produit->image;
                $produit->image = $newImageUrl;
                $changes['image'] = [$oldValue, $newImageUrl];
            }

            $produit->date_modification = now();
            $produit->save();

            foreach ($changes as $field => [$oldValue, $newValue]) {
                $this->history($this->productHistoryPayload(
                    'mise_a_jour',
                    'produits',
                    $produit->id,
                    'Mise à jour du champ ' . $field . '.',
                    (string) $oldValue,
                    (string) $newValue,
                    $request,
                    $user,
                    $entreprise->id
                ));
            }
        });

        if ($storedImagePath && $request->hasFile('image')) {
            // Le nouveau visuel est conservé en stockage public. L'ancien nettoyage peut être ajouté plus tard si besoin.
        }

        if ($produit->type_produit === 'physique' && (float) $produit->stock_actuel <= (float) $produit->seuil_alerte) {
            // TODO: créer la notification de stock faible mise à jour ici.
            // Notification::create([...]);
        }

            return response()->json([
                'data' => [
                    'produit' => $produit->fresh()->load('categorie'),
                ],
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'update', 'id' => $id]);
        }
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
            'password' => 'required|string',
        ], [
            'password.required' => 'Le mot de passe est requis.',
        ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

        $user = $this->currentUser($request);
        $entreprise = $this->currentEntreprise($request);

        if (!Hash::check($request->input('password'), $user->password_hash)) {
            return response()->json([
                'ok'      => false,
                'code'    => 'INVALID_PASSWORD',
                'message' => 'Mot de passe incorrect.',
            ], 422);
        }

        $produit = Produit::where('id', $id)
            ->where('entreprise', $entreprise->id)
            ->first();

        if (!$produit) {
            return response()->json([
                'ok'      => false,
                'code'    => 'NOT_FOUND',
                'message' => 'Produit introuvable.',
            ], 404);
        }

        $produit->update(['statut' => 'archive']);

        $this->history($this->productHistoryPayload(
            'archivage',
            'produits',
            $produit->id,
            'Produit archivé.',
            'actif',
            'archive',
            $request,
            $user,
            $entreprise->id
        ));

            return response()->json([
                'message' => 'Produit archivé',
            ], 200);
        } catch (\Throwable $e) {
            return $this->stockErrorResponse($e, $request, __METHOD__, ['action' => 'destroy', 'id' => $id]);
        }
    }
}
