<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CategorieProduit;
use App\Models\Entreprise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CategorieController extends Controller
{
    public function index(string $entrepriseId): JsonResponse
    {
        if (!Entreprise::find($entrepriseId)) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Entreprise introuvable.'], 404);
        }

        $categories = CategorieProduit::withCount(['produits' => fn($q) => $q->where('statut', 'actif')])
            ->where('entreprise', $entrepriseId)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $categories->map(fn($c) => [
                'id'          => $c->id,
                'name'        => $c->categorie,
                'description' => $c->description,
                'nb_produits' => $c->produits_count,
            ])->values(),
        ]);
    }

    public function store(Request $request, string $entrepriseId): JsonResponse
    {
        $entreprise = Entreprise::find($entrepriseId);
        if (!$entreprise) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Entreprise introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:150',
            'description' => 'nullable|string',
        ], [
            'name.required' => 'Le nom de la catégorie est requis.',
            'name.max'      => 'Le nom ne peut pas dépasser 150 caractères.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'code'    => 'VALIDATION_ERROR',
                'errors'  => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        $exists = CategorieProduit::where('entreprise', $entrepriseId)
            ->where('categorie', $request->name)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'code'    => 'DUPLICATE',
                'message' => 'Une catégorie avec ce nom existe déjà.',
            ], 422);
        }

        try {
            $categorie = CategorieProduit::create([
                'categorie'   => $request->name,
                'description' => $request->description,
                'entreprise'  => $entrepriseId,
                'utilisateur' => $entreprise->directeur,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie ajoutée avec succès.',
                'data'    => [
                    'id'          => $categorie->id,
                    'name'        => $categorie->categorie,
                    'description' => $categorie->description,
                    'nb_produits' => 0,
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Admin\\CategorieController@store', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la création.'], 500);
        }
    }

    public function destroy(Request $request, string $entrepriseId, string $categorieId): JsonResponse
    {
        /** @var \App\Models\Admin $admin */
        $admin = $request->attributes->get('authAdmin');

        if (!$request->filled('password')) {
            return response()->json(['success' => false, 'code' => 'VALIDATION_ERROR', 'message' => 'Le mot de passe est requis.'], 422);
        }

        if (!Hash::check($request->password, $admin->password_hash)) {
            return response()->json(['success' => false, 'code' => 'INVALID_PASSWORD', 'message' => 'Mot de passe incorrect.'], 403);
        }

        $categorie = CategorieProduit::where('id', $categorieId)
            ->where('entreprise', $entrepriseId)
            ->first();

        if (!$categorie) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Catégorie introuvable.'], 404);
        }

        try {
            $categorie->delete();

            return response()->json(['success' => true, 'message' => 'Catégorie supprimée avec succès.']);
        } catch (\Throwable $e) {
            Log::error('Admin\\CategorieController@destroy', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la suppression.'], 500);
        }
    }
}
