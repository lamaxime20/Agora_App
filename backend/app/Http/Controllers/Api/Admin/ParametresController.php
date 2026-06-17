<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\TokenAdmin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ParametresController extends Controller
{
    public function changeEmail(Request $request): JsonResponse
    {
        /** @var Admin $admin */
        $admin = $request->attributes->get('authAdmin');

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:admins,email,' . $admin->id,
        ], [
            'email.required' => "L'adresse e-mail est requise.",
            'email.email'    => 'Adresse e-mail invalide.',
            'email.unique'   => 'Cette adresse e-mail est déjà utilisée.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'code'    => 'VALIDATION_ERROR',
                'errors'  => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        try {
            $admin->email = $request->email;
            $admin->save();

            return response()->json(['success' => true, 'message' => 'Adresse e-mail mise à jour.']);
        } catch (\Throwable $e) {
            Log::error('Admin\\ParametresController@changeEmail', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la mise à jour.'], 500);
        }
    }

    public function changePassword(Request $request): JsonResponse
    {
        /** @var Admin $admin */
        $admin = $request->attributes->get('authAdmin');

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
                'success' => false,
                'code'    => 'VALIDATION_ERROR',
                'errors'  => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        if (!Hash::check($request->password_actuel, $admin->password_hash)) {
            return response()->json([
                'success' => false,
                'code'    => 'INVALID_PASSWORD',
                'message' => 'Mot de passe actuel incorrect.',
            ], 403);
        }

        try {
            $admin->password_hash = Hash::make($request->password);
            $admin->save();

            // Invalider tous les tokens actifs pour forcer la reconnexion
            TokenAdmin::where('admin', $admin->id)
                ->where('validite', true)
                ->update(['validite' => false]);

            return response()->json(['success' => true, 'message' => 'Mot de passe mis à jour. Veuillez vous reconnecter.']);
        } catch (\Throwable $e) {
            Log::error('Admin\\ParametresController@changePassword', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la mise à jour.'], 500);
        }
    }
}
