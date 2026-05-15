<?php

namespace App\Http\Controllers;

use App\Models\DocumentFournisseur;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class DocumentFournisseurController extends Controller
{
    public function index(): JsonResponse
    {
        $documents = DocumentFournisseur::with('fournisseur')->get();
        return response()->json($documents);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fournisseur_id' => 'required|exists:fournisseurs,id',
            'type' => 'required|in:Proforma,Facture',
            'fichier_pdf' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $document = DocumentFournisseur::create($request->all());
        return response()->json($document, 201);
    }

    public function show($id): JsonResponse
    {
        $document = DocumentFournisseur::with('fournisseur')->findOrFail($id);
        return response()->json($document);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $document = DocumentFournisseur::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'fournisseur_id' => 'sometimes|exists:fournisseurs,id',
            'type' => 'sometimes|in:Proforma,Facture',
            'fichier_pdf' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $document->update($request->all());
        return response()->json($document);
    }

    public function destroy($id): JsonResponse
    {
        $document = DocumentFournisseur::findOrFail($id);
        $document->delete();
        return response()->json(null, 204);
    }
}