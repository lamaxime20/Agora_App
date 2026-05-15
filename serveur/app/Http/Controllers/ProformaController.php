<?php

namespace App\Http\Controllers;

use App\Models\Proforma;
use App\Models\LigneProforma;
use App\Models\Dossier;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\PDF;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProformasExport;

class ProformaController extends Controller
{
    public function index(): JsonResponse
    {
        $proformas = Proforma::with(['dossier.client', 'ligneProformas'])->get();
        return response()->json($proformas);
    }

    public function store(Request $request): JsonResponse
    {
        Log::info('Requête POST /api/proformas reçue', ['request' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'dossier_id' => 'required|exists:dossiers,id|unique:proformas,dossier_id',
            'lignes' => 'required|array|min:1',
            'lignes.*.designation' => 'required|string|max:255',
            'lignes.*.quantite' => 'required|integer|min:1',
            'lignes.*.prix_unitaire' => 'required|numeric|min:0',
            'lignes.*.id' => 'sometimes|nullable',
            'currency' => 'required|string|in:FCFA,$,€',
        ]);

        if ($validator->fails()) {
            Log::error('Erreur de validation dans ProformaController::store', ['errors' => $validator->errors()]);
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Créer le proforma
            $proforma = Proforma::create([
                'dossier_id' => $request->dossier_id,
                'total_ttc' => 0,
                'currency' => $request->currency,
            ]);

            // Enregistrer les lignes de proforma
            $lignes = $request->input('lignes');
            $totalHT = 0;
            $savedLignes = [];

            foreach ($lignes as $ligne) {
                $ligneProforma = LigneProforma::create([
                    'proforma_id' => $proforma->id,
                    'designation' => $ligne['designation'],
                    'quantite' => $ligne['quantite'],
                    'prix_unitaire' => $ligne['prix_unitaire'],
                ]);

                $savedLignes[] = [
                    'id' => $ligneProforma->id,
                    'designation' => $ligne['designation'],
                    'quantite' => $ligne['quantite'],
                    'prix_unitaire' => $ligne['prix_unitaire'],
                    'temp_id' => $ligne['id'] ?? null,
                ];

                $totalHT += $ligne['quantite'] * $ligne['prix_unitaire'];
            }

            // Calculer et mettre à jour le total TTC
            $tva = $totalHT * 0.19;
            $totalTTC = $totalHT + $tva;
            $proforma->update(['total_ttc' => $totalTTC]);

            // Mettre à jour le dossier
            $dossier = Dossier::findOrFail($request->dossier_id);
            $dossier->update([
                'statut' => 'Encours',
                'etat' => 'Proforma',
            ]);
            Log::info('Dossier mis à jour', [
                'dossier_id' => $dossier->id,
                'statut' => 'Encours',
                'etat' => 'Proforma',
            ]);

            // Mettre à jour le statut du client
            $clientController = new ClientController();
            $clientController->updateClientStatus($dossier->client_id);

            Log::info('Proforma créé avec succès', [
                'proforma_id' => $proforma->id,
                'lignes' => $savedLignes,
                'total_ttc' => $totalTTC,
            ]);
            return response()->json($proforma->load('ligneProformas'), 201);
        } catch (\Exception $e) {
            Log::error('Erreur dans ProformaController::store', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors de la création du proforma'], 500);
        }
    }

    public function show($id): JsonResponse
    {
        $proforma = Proforma::with(['dossier.client', 'ligneProformas'])->findOrFail($id);
        return response()->json($proforma);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $proforma = Proforma::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'dossier_id' => 'sometimes|exists:dossiers,id|unique:proformas,dossier_id,' . $id,
            'total_ttc' => 'sometimes|numeric|min:0',
            'currency' => 'sometimes|string|in:FCFA,$,€',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $proforma->update($request->all());
        return response()->json($proforma);
    }

    public function destroy($id): JsonResponse
    {
        try {
            $proforma = Proforma::findOrFail($id);
            $dossier = Dossier::findOrFail($proforma->dossier_id);
            $dossier->update([
                'etat' => 'Demande',
                'statut' => 'Nouveau',
            ]);
            Log::info('Dossier mis à jour après suppression du proforma', [
                'dossier_id' => $dossier->id,
                'statut' => 'Nouveau',
                'etat' => 'Demande',
            ]);

            $clientController = new ClientController();
            $clientController->updateClientStatus($dossier->client_id);

            $proforma->ligneProformas()->delete();
            $proforma->delete();
            Log::info('Proforma supprimé avec succès', ['proforma_id' => $id]);
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erreur dans ProformaController::destroy', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors de la suppression du proforma'], 500);
        }
    }

    public function generatePdf($id)
    {
        try {
            $proforma = Proforma::with(['dossier.client', 'ligneProformas'])->findOrFail($id);
            $data = [
                'proforma' => $proforma,
                'date' => now()->format('d/m/Y'),
                'echeance' => now()->addDays(15)->format('d/m/Y'),
                'items' => $proforma->ligneProformas->map(function ($ligne) {
                    return [
                        'designation' => $ligne->designation,
                        'quantite' => $ligne->quantite,
                        'prix_unitaire' => $ligne->prix_unitaire,
                    ];
                })->toArray(),
                'totalPrice' => $proforma->total_ttc,
                'currency' => $proforma->currency,
            ];

            Log::info('PDF généré pour le proforma', ['proforma_id' => $id, 'items' => $data['items']]);
            $pdf = PDF::loadView('pdf.proforma', $data);
            return $pdf->download('proforma-' . $id . '.pdf');
        } catch (\Exception $e) {
            Log::error('Erreur dans ProformaController::generatePdf', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors de la génération du PDF'], 500);
        }
    }

    public function exportExcel($id)
    {
        try {
            $proforma = Proforma::with(['dossier.client', 'ligneProformas'])->findOrFail($id);
            Log::info('Export Excel généré pour le proforma', ['proforma_id' => $id]);
            return Excel::download(new ProformasExport($proforma), 'proforma_' . $id . '.xlsx');
        } catch (\Exception $e) {
            Log::error('Erreur dans ProformaController::exportExcel', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors de l\'exportation en Excel'], 500);
        }
    }

    public function checkProformaByDossier($dossierId): JsonResponse
    {
        try {
            $proforma = Proforma::where('dossier_id', $dossierId)
                ->with('ligneProformas')
                ->orderBy('created_at', 'desc')
                ->first();
            $response = [
                'exists' => !!$proforma,
            ];
            if ($proforma) {
                $response = array_merge($response, [
                    'id' => $proforma->id,
                    'total_ttc' => $proforma->total_ttc,
                    'currency' => $proforma->currency,
                    'ligne_proformas' => $proforma->ligneProformas->map(function ($ligne) {
                        return [
                            'id' => $ligne->id,
                            'designation' => $ligne->designation,
                            'quantite' => $ligne->quantite,
                            'prix_unitaire' => $ligne->prix_unitaire,
                        ];
                    })->toArray(),
                ]);
            }
            Log::info('Vérification proforma pour dossier', ['dossier_id' => $dossierId, 'response' => $response]);
            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Erreur dans ProformaController::checkProformaByDossier', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors de la vérification du proforma'], 500);
        }
    }
}