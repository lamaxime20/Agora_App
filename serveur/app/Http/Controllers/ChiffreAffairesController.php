<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Dossier;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class ChiffreAffairesController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Obtenir le chiffre d'affaires pour un client spécifique
     * Somme des total_ttc de toutes les proformas de tous les dossiers du client
     */
    public function turnoverByClient($clientId): JsonResponse
    {
        $client = Client::with(['dossiers.proforma'])->findOrFail($clientId);
        
        $totalTurnover = $client->dossiers->sum(function ($dossier) {
            return $dossier->proforma ? $dossier->proforma->total_ttc : 0;
        });

        return response()->json([
            'client_id' => $client->id,
            'nom_entreprise' => $client->nom_entreprise,
            'chiffre_affaires' => $totalTurnover
        ]);
    }

    /**
     * Obtenir le chiffre d'affaires pour un commercial spécifique
     * Somme des total_ttc de toutes les proformas de tous les dossiers de ses clients
     */
    public function turnoverByCommercial($commercialId): JsonResponse
    {
        $commercial = User::with(['clients.dossiers.proforma'])->findOrFail($commercialId);
        
        $totalTurnover = $commercial->clients->sum(function ($client) {
            return $client->dossiers->sum(function ($dossier) {
                return $dossier->proforma ? $dossier->proforma->total_ttc : 0;
            });
        });

        return response()->json([
            'commercial_id' => $commercial->id,
            'nom' => $commercial->name,
            'chiffre_affaires' => $totalTurnover
        ]);
    }

    /**
     * Obtenir le chiffre d'affaires pour un dossier spécifique
     * Retourne le total_ttc de la proforma associée
     */
    public function turnoverByDossier($dossierId): JsonResponse
    {
        $dossier = Dossier::with('proforma')->findOrFail($dossierId);
        
        $chiffreAffaires = $dossier->proforma ? $dossier->proforma->total_ttc : 0;

        return response()->json([
            'dossier_id' => $dossier->id,
            'nom' => $dossier->nom,
            'chiffre_affaires' => $chiffreAffaires
        ]);
    }
}