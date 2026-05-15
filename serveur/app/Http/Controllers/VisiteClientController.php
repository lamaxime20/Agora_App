<?php

namespace App\Http\Controllers;

use App\Models\VisiteClient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class VisiteClientController extends Controller
{
    public function index(): JsonResponse
    {
        $visites = VisiteClient::with(['client', 'utilisateur'])->get();
        return response()->json($visites);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:clients,id',
            'utilisateur_id' => 'required|exists:users,id',
            'date_visite' => 'required|date',
            'objet' => 'required|string|max:255',
            'rapport' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $visite = VisiteClient::create($request->all());
        return response()->json($visite, 201);
    }

    public function show($id): JsonResponse
    {
        $visite = VisiteClient::with(['client', 'utilisateur'])->findOrFail($id);
        return response()->json($visite);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $visite = VisiteClient::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'client_id' => 'sometimes|exists:clients,id',
            'utilisateur_id' => 'sometimes|exists:users,id',
            'date_visite' => 'sometimes|date',
            'objet' => 'sometimes|string|max:255',
            'rapport' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $visite->update($request->all());
        return response()->json($visite);
    }

    public function destroy($id): JsonResponse
    {
        $visite = VisiteClient::findOrFail($id);
        $visite->delete();
        return response()->json(null, 204);
    }
}