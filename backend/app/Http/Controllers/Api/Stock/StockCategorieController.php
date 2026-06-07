<?php

namespace App\Http\Controllers\Api\Stock;

use App\Models\CategorieProduit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StockCategorieController extends StockBaseController
{
    public function index(Request $request): JsonResponse
    {
        $entreprise = $this->currentEntreprise($request);
        $search = trim((string) $request->query('search', ''));

        $query = CategorieProduit::query()
            ->where('entreprise', $entreprise->id)
            ->orderBy('categorie');

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('categorie', 'ilike', '%' . $search . '%')
                    ->orWhere('description', 'ilike', '%' . $search . '%');
            });
        }

        $categories = $query->get()->map(function (CategorieProduit $categorie) {
            return [
                'id'          => $categorie->id,
                'categorie'   => $categorie->categorie,
                'description' => $categorie->description,
                'entreprise'  => $categorie->entreprise,
                'utilisateur' => $categorie->utilisateur,
            ];
        });

        return response()->json([
            'data' => [
                'categories' => $categories,
                'total'      => $categories->count(),
            ],
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'categorie'   => 'required|string|min:2|max:150',
            'description' => 'nullable|string',
        ], [
            'categorie.required' => 'Le nom de la catégorie est requis.',
            'categorie.min'      => 'Le nom de la catégorie doit contenir au moins 2 caractères.',
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

        $exists = CategorieProduit::where('entreprise', $entreprise->id)
            ->whereRaw('LOWER(categorie) = ?', [mb_strtolower(trim($request->input('categorie')))])
            ->exists();

        if ($exists) {
            return response()->json([
                'ok'      => false,
                'code'    => 'CATEGORY_ALREADY_EXISTS',
                'message' => 'Cette catégorie existe déjà pour cette entreprise.',
            ], 409);
        }

        $categorie = CategorieProduit::create([
            'categorie'   => trim((string) $request->input('categorie')),
            'description' => $request->input('description'),
            'entreprise'  => $entreprise->id,
            'utilisateur' => $user->id,
        ]);

        $this->history($this->productHistoryPayload(
            'creation',
            'categories_produit',
            $categorie->id,
            'Création de la catégorie de produit.',
            null,
            $categorie->categorie,
            $request,
            $user,
            $entreprise->id
        ));

        return response()->json([
            'data' => [
                'categorie' => $categorie,
            ],
        ], 201);
    }
}
