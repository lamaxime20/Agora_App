<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class DossierController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(): JsonResponse
    {
        $dossiers = Dossier::with('client', 'proforma')->get();
        Log::info('Dossiers récupérés', ['count' => $dossiers->count()]);
        return response()->json($dossiers);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:150',
            'client_id' => 'required|exists:clients,id',
            'statut' => 'nullable|in:Nouveau,Encours,Cloture',
            'etat' => 'nullable|in:Demande,Proforma,Bon de commande,Facturation,Bon de livraison,Termine',
            'documents' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            Log::error('Erreur de validation dans DossierController::store', ['errors' => $validator->errors()]);
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $dossier = Dossier::create([
                'nom' => $request->nom,
                'client_id' => $request->client_id,
                'commercial_id' => auth()->user()->id,
                'statut' => $request->statut ?? 'Nouveau',
                'etat' => $request->etat ?? 'Demande',
                'documents' => json_encode($request->documents ?? []),
            ]);
            Log::info('Dossier créé avec succès', ['dossier_id' => $dossier->id, 'documents' => $dossier->documents]);
            return response()->json($dossier->load('client'), 201);
        } catch (\Exception $e) {
            Log::error('Erreur dans DossierController::store', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors de la création du dossier'], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $dossier = Dossier::with('client')->findOrFail($id);
            Log::info('Dossier récupéré', ['dossier_id' => $id, 'documents' => $dossier->documents]);
            return response()->json($dossier);
        } catch (\Exception $e) {
            Log::error('Erreur dans DossierController::show', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Dossier non trouvé'], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        $dossier = Dossier::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:150',
            'client_id' => 'sometimes|exists:clients,id',
            'statut' => 'sometimes|in:Nouveau,Encours,Cloture',
            'etat' => 'sometimes|in:Demande,Proforma,Bon de commande,Facturation,Bon de livraison,Termine',
            'documents' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            Log::error('Erreur de validation dans DossierController::update', ['errors' => $validator->errors()]);
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $data = $request->only(['nom', 'client_id', 'statut', 'etat', 'documents']);
            if (isset($data['documents'])) {
                $data['documents'] = json_encode($data['documents']);
            }
            $dossier->update($data);
            Log::info('Dossier mis à jour', ['dossier_id' => $id, 'data' => $data]);
            return response()->json($dossier->load('client'));
        } catch (\Exception $e) {
            Log::error('Erreur dans DossierController::update', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors de la mise à jour du dossier'], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $dossier = Dossier::findOrFail($id);
            $dossier->delete();
            Log::info('Dossier supprimé', ['dossier_id' => $id]);
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erreur dans DossierController::destroy', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors de la suppression du dossier'], 500);
        }
    }

    public function countByClient($clientId): JsonResponse
    {
        try {
            $count = Dossier::where('client_id', $clientId)->count();
            Log::info('Comptage des dossiers pour client', ['client_id' => $clientId, 'count' => $count]);
            return response()->json([
                'client_id' => $clientId,
                'total_dossiers' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur dans DossierController::countByClient', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors du comptage des dossiers'], 500);
        }
    }

    public function listByCommercial($commercialId): JsonResponse
    {
        try {
            $dossiers = Dossier::with(['client' => function ($query) {
                $query->select('id', 'nom_entreprise', 'contact', 'email', 'adresse', 'etat', 'commercial_id');
            }])
                ->whereHas('client', function ($query) use ($commercialId) {
                    $query->where('commercial_id', $commercialId);
                })
                ->get()
                ->map(function ($dossier) {
                    $dossier->documents = is_string($dossier->documents) ? json_decode($dossier->documents, true) : ($dossier->documents ?? []);
                    return $dossier;
                });
            Log::info('Dossiers récupérés pour le commercial', ['commercial_id' => $commercialId, 'count' => $dossiers->count(), 'dossiers' => $dossiers->toArray()]);
            return response()->json($dossiers);
        } catch (\Exception $e) {
            Log::error('Erreur dans DossierController::listByCommercial', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Erreur serveur lors de la récupération des dossiers'], 500);
        }
    }
}