<?php

namespace App\Http\Controllers;

use App\Models\BonLivraison;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\PDF;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\BonLivraisonsExport;
use App\Imports\BonLivraisonsImport;

class BonLivraisonController extends Controller
{
    public function index(): JsonResponse
    {
        $bons = BonLivraison::with('bonCommande.proforma.dossier.client')->get();
        return response()->json($bons);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'bon_commande_id' => 'required|exists:bon_commandes,id',
            'etat' => 'required|in:En attente,Livre',
            'delai_livraison' => 'nullable|in:Dans les délais,Hors délai',
            'bon_livraison_scan_pdf' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $bon = BonLivraison::create($request->all());
        return response()->json($bon, 201);
    }

    public function show($id): JsonResponse
    {
        $bon = BonLivraison::with('bonCommande.proforma.dossier.client')->findOrFail($id);
        return response()->json($bon);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $bon = BonLivraison::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'bon_commande_id' => 'sometimes|exists:bon_commandes,id',
            'etat' => 'sometimes|in:En attente,Livre',
            'delai_livraison' => 'nullable|in:Dans les délais,Hors délai',
            'bon_livraison_scan_pdf' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $bon->update($request->all());
        return response()->json($bon);
    }

    public function destroy($id): JsonResponse
    {
        $bon = BonLivraison::findOrFail($id);
        $bon->delete();
        return response()->json(null, 204);
    }

}