<?php

namespace App\Http\Controllers;

use App\Models\Fournisseur;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class FournisseurController extends Controller
{
    public function index(): JsonResponse
    {
        $fournisseurs = Fournisseur::all();
        return response()->json($fournisseurs);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom_entreprise' => 'required|string|max:150',
            'contact' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:fournisseurs,email',
            'adresse' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $fournisseur = Fournisseur::create($request->all());
        return response()->json($fournisseur, 201);
    }

    public function show($id): JsonResponse
    {
        $fournisseur = Fournisseur::findOrFail($id);
        return response()->json($fournisseur);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $fournisseur = Fournisseur::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'nom_entreprise' => 'sometimes|string|max:150',
            'contact' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|max:150|unique:fournisseurs,email,' . $id,
            'adresse' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $fournisseur->update($request->all());
        return response()->json($fournisseur);
    }

    public function destroy($id): JsonResponse
    {
        $fournisseur = Fournisseur::findOrFail($id);
        $fournisseur->delete();
        return response()->json(null, 204);
    }
}