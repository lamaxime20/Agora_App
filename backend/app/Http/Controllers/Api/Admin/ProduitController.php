<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use App\Models\Produit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProduitController extends Controller
{
    public function index(string $entrepriseId): JsonResponse
    {
        if (!Entreprise::find($entrepriseId)) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Entreprise introuvable.'], 404);
        }

        $produits = Produit::with('categorie')
            ->where('entreprise', $entrepriseId)
            ->where('statut', 'actif')
            ->orderBy('date_creation', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $produits->map(function ($p) {
                $cat = $p->getRelation('categorie');

                return [
                    'id'            => $p->id,
                    'name'          => $p->nom,
                    'description'   => $p->description,
                    'type'          => $p->type_produit,
                    'prix_unitaire' => (float) $p->prix_unitaire,
                    'stock_actuel'  => (float) ($p->stock_actuel ?? 0),
                    'seuil_alerte'  => (float) ($p->seuil_alerte ?? 0),
                    'unite_mesure'  => $p->unite_mesure,
                    'image'         => $p->image,
                    'categorie'     => [
                        'id'   => $cat?->id,
                        'name' => $cat?->categorie,
                    ],
                ];
            })->values(),
        ]);
    }

    public function store(Request $request, string $entrepriseId): JsonResponse
    {
        $entreprise = Entreprise::find($entrepriseId);
        if (!$entreprise) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Entreprise introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'          => 'required|string|max:255',
            'type'          => 'required|in:physique,service',
            'prix_unitaire' => 'required|numeric|min:0',
            'categorie_id'  => 'required|string|exists:categories_produit,id',
            'description'   => 'nullable|string',
            'stock_actuel'  => 'nullable|numeric|min:0',
            'seuil_alerte'  => 'nullable|numeric|min:0',
            'unite_mesure'  => 'nullable|string|max:50',
            'image'         => 'nullable|string',
        ], [
            'name.required'          => 'Le nom du produit est requis.',
            'type.required'          => 'Le type est requis.',
            'type.in'                => 'Le type doit être physique ou service.',
            'prix_unitaire.required' => 'Le prix est requis.',
            'prix_unitaire.numeric'  => 'Le prix doit être un nombre.',
            'categorie_id.required'  => 'La catégorie est requise.',
            'categorie_id.exists'    => 'Catégorie introuvable.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'code'    => 'VALIDATION_ERROR',
                'errors'  => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        try {
            $produit = Produit::create([
                'nom'            => $request->name,
                'type_produit'   => $request->type,
                'prix_unitaire'  => $request->prix_unitaire,
                'categorie'      => $request->categorie_id,
                'description'    => $request->description,
                'stock_actuel'   => $request->type === 'physique' ? ($request->stock_actuel ?? 0) : null,
                'seuil_alerte'   => $request->type === 'physique' ? ($request->seuil_alerte ?? 0) : null,
                'unite_mesure'   => $request->unite_mesure,
                'image'          => $request->image,
                'date_creation'  => now(),
                'statut'         => 'actif',
                'entreprise'     => $entrepriseId,
                'utilisateur'    => $entreprise->directeur,
            ]);

            $produit->load('categorie');
            $cat = $produit->getRelation('categorie');

            return response()->json([
                'success' => true,
                'message' => 'Produit ajouté avec succès.',
                'data'    => [
                    'id'            => $produit->id,
                    'name'          => $produit->nom,
                    'description'   => $produit->description,
                    'type'          => $produit->type_produit,
                    'prix_unitaire' => (float) $produit->prix_unitaire,
                    'stock_actuel'  => (float) ($produit->stock_actuel ?? 0),
                    'seuil_alerte'  => (float) ($produit->seuil_alerte ?? 0),
                    'unite_mesure'  => $produit->unite_mesure,
                    'image'         => $produit->image,
                    'categorie'     => [
                        'id'   => $cat?->id,
                        'name' => $cat?->categorie,
                    ],
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Admin\\ProduitController@store', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la création.'], 500);
        }
    }

    public function destroy(Request $request, string $entrepriseId, string $produitId): JsonResponse
    {
        /** @var \App\Models\Admin $admin */
        $admin = $request->attributes->get('authAdmin');

        if (!$request->filled('password')) {
            return response()->json(['success' => false, 'code' => 'VALIDATION_ERROR', 'message' => 'Le mot de passe est requis.'], 422);
        }

        if (!Hash::check($request->password, $admin->password_hash)) {
            return response()->json(['success' => false, 'code' => 'INVALID_PASSWORD', 'message' => 'Mot de passe incorrect.'], 403);
        }

        $produit = Produit::where('id', $produitId)
            ->where('entreprise', $entrepriseId)
            ->first();

        if (!$produit) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Produit introuvable.'], 404);
        }

        try {
            $produit->update(['statut' => 'archive']);

            return response()->json(['success' => true, 'message' => 'Produit supprimé avec succès.']);
        } catch (\Throwable $e) {
            Log::error('Admin\\ProduitController@destroy', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la suppression.'], 500);
        }
    }
}
