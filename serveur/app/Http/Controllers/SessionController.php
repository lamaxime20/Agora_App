<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SessionController extends Controller
{
    public function index(): JsonResponse
    {
        $sessions = Session::with('user')->get();
        return response()->json($sessions);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'nullable|exists:users,id',
            'ip_address' => 'nullable|string|max:45',
            'user_agent' => 'nullable|string',
            'payload' => 'required|string',
            'last_activity' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $session = Session::create($request->all());
        return response()->json($session, 201);
    }

    public function show($id): JsonResponse
    {
        $session = Session::with('user')->findOrFail($id);
        return response()->json($session);
    }

    public function destroy($id): JsonResponse
    {
        $session = Session::findOrFail($id);
        $session->delete();
        return response()->json(null, 204);
    }
}