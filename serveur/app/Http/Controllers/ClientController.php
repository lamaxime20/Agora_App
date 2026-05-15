<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Dossier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class ClientController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(): JsonResponse
    {
        $clients = Client::with('commercial')->get();
        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom_entreprise' => 'required|string|max:150',
            'contact' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:clients,email',
            'adresse' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $client = Client::create([
            'nom_entreprise' => $request->nom_entreprise,
            'contact' => $request->contact,
            'email' => $request->email,
            'adresse' => $request->adresse,
            'etat' => 'Prospect',
            'commercial_id' => Auth::id(),
        ]);

        $client->load('commercial');

        return response()->json($client, 201);
    }

    public function show($id): JsonResponse
    {
        $client = Client::with('commercial')->findOrFail($id);
        return response()->json($client);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $client = Client::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'nom_entreprise' => 'sometimes|string|max:150',
            'contact' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|max:150|unique:clients,email,' . $id,
            'adresse' => 'sometimes|string',
            'etat' => 'sometimes|in:Prospect,Client',
            'commercial_id' => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $client->update($request->all());
        return response()->json($client);
    }

    public function destroy($id): JsonResponse
    {
        $client = Client::findOrFail($id);
        $client->delete();
        return response()->json(null, 204);
    }

    public function listByCommercial($commercialId): JsonResponse
    {
        $clients = Client::with('commercial')
            ->where('commercial_id', $commercialId)
            ->get();

        return response()->json($clients);
    }

    /**
     * Vérifier et mettre à jour le statut du client en fonction des dossiers
     */
    public function updateClientStatus($clientId): void
    {
        $client = Client::findOrFail($clientId);
        $dossiers = Dossier::where('client_id', $clientId)->get();
        $etatOrder = ['Demande', 'Proforma', 'Bon de Commande', 'Facturation', 'Terminé'];

        $hasQualifyingDossier = $dossiers->contains(function ($dossier) use ($etatOrder) {
            return in_array($dossier->statut, ['Encours', 'Cloturé']) &&
                   array_search($dossier->etat, $etatOrder) >= array_search('Proforma', $etatOrder);
        });

        if ($hasQualifyingDossier && $client->etat !== 'Client') {
            $client->update(['etat' => 'Client']);
        }
    }
}