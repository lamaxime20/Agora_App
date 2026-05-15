<?php

namespace App\Http\Controllers;

use App\Models\PasswordResetToken;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class PasswordResetTokenController extends Controller
{
    public function index(): JsonResponse
    {
        $tokens = PasswordResetToken::all();
        return response()->json($tokens);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255|exists:users,email',
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $token = PasswordResetToken::create($request->all());
        return response()->json($token, 201);
    }

    public function show($id): JsonResponse
    {
        $token = PasswordResetToken::findOrFail($id);
        return response()->json($token);
    }

    public function destroy($id): JsonResponse
    {
        $token = PasswordResetToken::findOrFail($id);
        $token->delete();
        return response()->json(null, 204);
    }
}