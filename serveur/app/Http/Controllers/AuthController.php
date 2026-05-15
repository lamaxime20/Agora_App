<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email non trouvé'], 404);
        }
        if (!Hash::check($request->password, $user->password)){
            return response()->json(['message'=> 'Mot de passe incorrect'], 401);
        }

        // Générer un token Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        // Retourner la réponse avec le token, l'utilisateur et l'URL de redirection
        return response()->json([
            'message' => 'Connexion réussie',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie'], 200);
    }
}