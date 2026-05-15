<?php

namespace App\Http\Controllers;

use App\Models\BonCommande;
use App\Models\Proforma;
use App\Models\Dossier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class BonCommandeController extends Controller
{
    public function index(): JsonResponse
    {
        $bons = BonCommande::with(['proforma.dossier.client', 'proforma.ligneProformas'])->get();
        return response()->json($bons);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            // Validation des données
            $validator = Validator::make($request->all(), [
                'proforma_id' => 'required|exists:proformas,id',
                'date_livraison_prevue' => 'required|date',
                'fichier_scan' => 'nullable|file|mimes:pdf|max:2048',
                'statut_livraison' => 'required|in:En attente de livraison,Livraison dans les délais,Livraison hors délais',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed for bon-commande creation', ['errors' => $validator->errors()]);
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->all();
            $data['statut_livraison'] = $data['statut_livraison'] ?? 'En attente de livraison';

            // Gérer le téléversement du fichier
            $data = $request->all();
            if ($request->hasFile('fichier_scan')) {
                try {
                    $path = $request->file('fichier_scan')->store('bon-commandes', 'public');
                    $data['fichier_scan'] = $path;
                    Log::info('File uploaded successfully', ['path' => $path]);
                } catch (\Exception $e) {
                    Log::error('Failed to store fichier_scan', ['error' => $e->getMessage()]);
                    return response()->json(['error' => 'Erreur lors du stockage du fichier'], 500);
                }
            }

            // Créer le bon de commande
            $bon = BonCommande::create($data);
            Log::info('BonCommande created', ['id' => $bon->id]);

            // Mettre à jour le statut et l'état du dossier
            $proforma = Proforma::findOrFail($request->proforma_id);
            $dossier = Dossier::findOrFail($proforma->dossier_id);
            $dossier->statut = 'Encours';
            $dossier->etat = 'Bon de Commande';
            $dossier->save();
            Log::info('Dossier updated', [
                'dossier_id' => $dossier->id,
                'statut' => $dossier->statut,
                'etat' => $dossier->etat,
            ]);

            return response()->json($bon->load('proforma.ligneProformas'), 201);
        } catch (\Exception $e) {
            Log::error('Error in BonCommandeController::store', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur: ' . $e->getMessage()], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $bon = BonCommande::with(['proforma.dossier.client', 'proforma.ligneProformas'])->findOrFail($id);
            return response()->json($bon);
        } catch (\Exception $e) {
            Log::error('Error in BonCommandeController::show', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $bon = BonCommande::findOrFail($id);
            $validator = Validator::make($request->all(), [
                'proforma_id' => 'sometimes|exists:proformas,id',
                'date_livraison_prevue' => 'sometimes|date',
                'fichier_scan' => 'nullable|file|mimes:pdf|max:2048',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed for bon-commande update', ['errors' => $validator->errors()]);
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->all();
            if ($request->hasFile('fichier_scan')) {
                if ($bon->fichier_scan) {
                    Storage::disk('public')->delete($bon->fichier_scan);
                }
                $path = $request->file('fichier_scan')->store('bon-commandes', 'public');
                $data['fichier_scan'] = $path;
                Log::info('File uploaded successfully for update', ['path' => $path]);
            }

            $bon->update($data);
            return response()->json($bon);
        } catch (\Exception $e) {
            Log::error('Error in BonCommandeController::update', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $bon = BonCommande::findOrFail($id);
            $proforma = Proforma::findOrFail($bon->proforma_id);
            $dossier = Dossier::findOrFail($proforma->dossier_id);
            $dossier->statut = 'Encours';
            $dossier->etat = 'Proforma';
            $dossier->save();
            Log::info('Dossier updated after bon-commande deletion', [
                'dossier_id' => $dossier->id,
                'statut' => $dossier->statut,
                'etat' => $dossier->etat,
            ]);

            if ($bon->fichier_scan) {
                Storage::disk('public')->delete($bon->fichier_scan);
            }
            $bon->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error in BonCommandeController::destroy', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    public function generatePdf($id)
    {
        try {
            $bon = BonCommande::with(['proforma.dossier.client', 'proforma.ligneProformas'])->findOrFail($id);
            $proforma = $bon->proforma;
            $dossier = $proforma->dossier;
            $client = $dossier->client;

            $items = $proforma->ligneProformas->map(function ($ligne) {
                return [
                    'designation' => $ligne->designation,
                    'quantite' => $ligne->quantite,
                    'prix_unitaire' => $ligne->prix_unitaire,
                ];
            })->toArray();

            $data = [
                'bon' => $bon,
                'proforma' => $proforma,
                'dossier' => $dossier,
                'client' => $client,
                'items' => $items,
                'totalPrice' => $proforma->total_ttc ?? 0,
                'currency' => $proforma->currency ?? 'FCFA',
            ];

            Log::info('Generating PDF for bon-commande', [
                'bon_id' => $id,
                'items' => $items,
                'totalPrice' => $proforma->total_ttc,
                'currency' => $proforma->currency,
            ]);

            $pdf = Pdf::loadView('pdf.bon-commande', $data);
            return $pdf->download("bon-commande-{$id}.pdf");
        } catch (\Exception $e) {
            Log::error('Error in BonCommandeController::generatePdf', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur lors de la génération du PDF'], 500);
        }
    }

    public function download($id)
    {
        try {
            $bon = BonCommande::findOrFail($id);
            if ($bon->fichier_scan && Storage::disk('public')->exists($bon->fichier_scan)) {
                Log::info('Downloading fichier_scan for bon-commande', ['bon_id' => $id, 'fichier_scan' => $bon->fichier_scan]);
                return Storage::disk('public')->download($bon->fichier_scan);
            }
            Log::warning('Fichier non trouvé pour bon-commande', ['bon_id' => $id]);
            return response()->json(['error' => 'Fichier non trouvé'], 404);
        } catch (\Exception $e) {
            Log::error('Error in BonCommandeController::download', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    public function getByDossier($dossierId): JsonResponse
    {
        try {
            $bons = BonCommande::with(['proforma.ligneProformas'])
                ->whereHas('proforma', function ($query) use ($dossierId) {
                    $query->where('dossier_id', $dossierId);
                })
                ->get()
                ->map(function ($bon) {
                    return [
                        'id' => $bon->id,
                        'type' => 'Bon de Commande',
                        'file' => "bon-commande-{$bon->id}.pdf",
                        'proformaId' => $bon->proforma_id,
                        'dateLivraison' => $bon->date_livraison_prevue,
                        'items' => $bon->proforma->ligneProformas->map(function ($ligne) {
                            return [
                                'designation' => $ligne->designation,
                                'quantite' => $ligne->quantite,
                                'prix_unitaire' => $ligne->prix_unitaire,
                            ];
                        })->toArray(),
                        'totalPrice' => $bon->proforma->total_ttc ?? 0,
                        'currency' => $bon->proforma->currency ?? 'FCFA',
                        'fichier_scan' => $bon->fichier_scan,
                    ];
                });
            Log::info('Bons de commande récupérés pour dossier', ['dossier_id' => $dossierId, 'count' => $bons->count()]);
            return response()->json($bons);
        } catch (\Exception $e) {
            Log::error('Erreur dans BonCommandeController::getByDossier', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors de la récupération des bons de commande'], 500);
        }
    }
}