<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\PDF;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\FacturesExport;
use App\Imports\FacturesImport;

class FactureController extends Controller
{
    public function index(): JsonResponse
    {
        $factures = Facture::with(['bonCommande', 'valideePar'])->get();
        return response()->json($factures);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'bon_commande_id' => 'required|exists:bon_commandes,id',
            'etat' => 'required|in:En attente de validation,Non payee,Payee',
            'recu_paiement_pdf' => 'nullable|string',
            'validee_par' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $facture = Facture::create($request->all());
        return response()->json($facture, 201);
    }

    public function show($id): JsonResponse
    {
        $facture = Facture::with(['bonCommande', 'valideePar'])->findOrFail($id);
        return response()->json($facture);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $facture = Facture::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'bon_commande_id' => 'sometimes|exists:bon_commandes,id',
            'etat' => 'sometimes|in:En attente de validation,Non payee,Payee',
            'recu_paiement_pdf' => 'nullable|string',
            'validee_par' => 'sometimes|nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $facture->update($request->all());
        return response()->json($facture);
    }

    public function destroy($id): JsonResponse
    {
        $facture = Facture::findOrFail($id);
        $facture->delete();
        return response()->json(null, 204);
    }

    public function generatePdf($id)
    {
        $facture = Facture::with(['bonCommande.proforma.dossier.client'])->findOrFail($id);
        $pdf = PDF::loadView('pdf.facture', compact('facture'));
        return $pdf->download('facture-' . $id . '.pdf');
    }

}