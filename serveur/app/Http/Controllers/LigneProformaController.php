<?php

namespace App\Http\Controllers;

use App\Models\LigneProforma;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class LigneProformaController extends Controller
{
    public function index(): JsonResponse
    {
        $lignes = LigneProforma::with('proforma')->get();
        return response()->json($lignes);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'proforma_id' => 'required|exists:proformas,id',
            'designation' => 'required|string|max:255',
            'quantite' => 'required|integer|min:1',
            'prix_unitaire' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ligne = LigneProforma::create($request->all());
        return response()->json($ligne, 201);
    }

    public function show($id): JsonResponse
    {
        $ligne = LigneProforma::with('proforma')->findOrFail($id);
        return response()->json($ligne);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $ligne = LigneProforma::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'proforma_id' => 'sometimes|exists:proformas,id',
            'designation' => 'sometimes|string|max:255',
            'quantite' => 'sometimes|integer|min:1',
            'prix_unitaire' => 'sometimes|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ligne->update($request->all());
        return response()->json($ligne);
    }

    public function destroy($id): JsonResponse
    {
        $ligne = LigneProforma::findOrFail($id);
        $ligne->delete();
        return response()->json(null, 204);
    }
}