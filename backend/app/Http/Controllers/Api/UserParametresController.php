<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SessionApp;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class UserParametresController extends Controller
{
    // PATCH /api/user/parametres/email — protégé MiddlewareTokenAuthorization
    public function changeEmail(Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $request->attributes->get('authorizedUser');

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:utilisateurs,email,' . $user->id,
        ], [
            'email.required' => "L'adresse e-mail est requise.",
            'email.email'    => 'Adresse e-mail invalide.',
            'email.unique'   => 'Cette adresse e-mail est déjà utilisée.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'     => false,
                'code'   => 'VALIDATION_ERROR',
                'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        try {
            $user->email = $request->email;
            $user->save();

            return response()->json([
                'ok'      => true,
                'message' => 'Adresse e-mail mise à jour.',
                'email'   => $user->email,
            ]);
        } catch (\Throwable $e) {
            Log::error('UserParametresController@changeEmail', ['message' => $e->getMessage()]);

            return response()->json([
                'ok'      => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Erreur lors de la mise à jour.',
            ], 500);
        }
    }

    // PATCH /api/user/parametres/mot-de-passe — protégé MiddlewareTokenAuthorization
    public function changePassword(Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $request->attributes->get('authorizedUser');

        $validator = Validator::make($request->all(), [
            'password_actuel'       => 'required|string',
            'password'              => 'required|string|min:8',
            'password_confirmation' => 'required|same:password',
        ], [
            'password_actuel.required'       => 'Le mot de passe actuel est requis.',
            'password.required'              => 'Le nouveau mot de passe est requis.',
            'password.min'                   => 'Au moins 8 caractères requis.',
            'password_confirmation.required' => 'La confirmation est requise.',
            'password_confirmation.same'     => 'Les mots de passe ne correspondent pas.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'     => false,
                'code'   => 'VALIDATION_ERROR',
                'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        if (!Hash::check($request->password_actuel, $user->password_hash)) {
            return response()->json([
                'ok'      => false,
                'code'    => 'INVALID_PASSWORD',
                'message' => 'Mot de passe actuel incorrect.',
            ], 403);
        }

        try {
            $user->password_hash = Hash::make($request->password);
            $user->save();

            // Invalider toutes les sessions actives — force la reconnexion
            SessionApp::where('utilisateur', $user->id)
                ->where('validite', true)
                ->update(['validite' => false]);

            return response()->json([
                'ok'      => true,
                'message' => 'Mot de passe mis à jour. Veuillez vous reconnecter.',
            ]);
        } catch (\Throwable $e) {
            Log::error('UserParametresController@changePassword', ['message' => $e->getMessage()]);

            return response()->json([
                'ok'      => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Erreur lors de la mise à jour.',
            ], 500);
        }
    }
}
