<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CodeReinitialisation;
use App\Models\SessionApp;
use App\Models\TokenChoixRole;
use App\Models\Utilisateur;
use App\Support\BrevoMailer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PasswordController extends Controller
{
    // POST /api/auth/password/send-code
    public function sendCode(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ], [
            'email.required' => 'L\'adresse e-mail est requise.',
            'email.email'    => 'Adresse e-mail invalide.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'     => false,
                'code'   => 'VALIDATION_ERROR',
                'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        $user = Utilisateur::where('email', $request->email)
            ->where('statut', 'actif')
            ->first();

        if (!$user) {
            return response()->json([
                'ok'      => false,
                'code'    => 'EMAIL_NOT_FOUND',
                'message' => 'Aucun compte actif n\'existe avec cette adresse e-mail.',
            ], 404);
        }

        $code       = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiration = now()->addHour();

        try {
            CodeReinitialisation::where('utilisateur', $user->id)
                ->where('utilise', false)
                ->update(['actif' => false]);

            CodeReinitialisation::create([
                'code'            => $code,
                'utilisateur'     => $user->id,
                'date_expiration' => $expiration,
                'utilise'         => false,
                'actif'           => true,
            ]);

            $mailer = new BrevoMailer();
            $sent   = $mailer->sendPasswordResetEmail($user->email, $user->prename . ' ' . $user->name, $code);

            if (!$sent) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'SERVER_ERROR',
                    'message' => 'Impossible d\'envoyer le code pour le moment. Réessayez.',
                ], 500);
            }
        } catch (\Throwable $e) {
            Log::error('PasswordController@sendCode error', ['message' => $e->getMessage()]);
            return response()->json([
                'ok'      => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Impossible d\'envoyer le code pour le moment. Réessayez.',
            ], 500);
        }

        return response()->json([
            'ok'      => true,
            'message' => 'Un code de réinitialisation a été envoyé à votre adresse e-mail.',
        ], 200);
    }

    // POST /api/auth/password/verify-code
    public function verifyCode(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ], [
            'email.required' => 'L\'adresse e-mail est requise.',
            'email.email'    => 'Adresse e-mail invalide.',
            'code.required'  => 'Le code est requis.',
            'code.size'      => 'Le code doit contenir exactement 6 chiffres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'     => false,
                'code'   => 'VALIDATION_ERROR',
                'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        $user = Utilisateur::where('email', $request->email)
            ->where('statut', 'actif')
            ->first();

        if (!$user) {
            return response()->json([
                'ok'      => false,
                'code'    => 'CODE_NOT_FOUND',
                'message' => 'Aucun code actif pour cette adresse e-mail.',
            ], 404);
        }

        $record = CodeReinitialisation::where('utilisateur', $user->id)
            ->where('actif', true)
            ->where('utilise', false)
            ->orderByDesc('date_creation')
            ->first();

        if (!$record) {
            return response()->json([
                'ok'      => false,
                'code'    => 'CODE_NOT_FOUND',
                'message' => 'Aucun code actif pour cette adresse e-mail.',
            ], 404);
        }

        if (Carbon::parse($record->date_expiration)->isPast()) {
            $record->update(['actif' => false]);
            return response()->json([
                'ok'      => false,
                'code'    => 'CODE_EXPIRED',
                'message' => 'Le code de réinitialisation a expiré.',
            ], 410);
        }

        if (!hash_equals($record->code, $request->code)) {
            return response()->json([
                'ok'      => false,
                'code'    => 'INVALID_CODE',
                'message' => 'Code de réinitialisation incorrect.',
            ], 422);
        }

        $record->update(['utilise' => true]);

        return response()->json([
            'ok'      => true,
            'message' => 'Code de réinitialisation validé.',
        ], 200);
    }

    // POST /api/auth/password/reset
    public function reset(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'                 => 'required|email',
            'password'              => 'required|string|min:8',
            'password_confirmation' => 'required|same:password',
        ], [
            'email.required'                 => 'L\'adresse e-mail est requise.',
            'email.email'                    => 'Adresse e-mail invalide.',
            'password.required'              => 'Le mot de passe est requis.',
            'password.min'                   => 'Au moins 8 caractères requis.',
            'password_confirmation.required' => 'La confirmation du mot de passe est requise.',
            'password_confirmation.same'     => 'Les mots de passe ne correspondent pas.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'     => false,
                'code'   => 'VALIDATION_ERROR',
                'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        $user = Utilisateur::where('email', $request->email)
            ->where('statut', 'actif')
            ->first();

        if (!$user) {
            return response()->json([
                'ok'      => false,
                'code'    => 'USER_NOT_FOUND',
                'message' => 'Aucun compte actif n\'existe avec cette adresse e-mail.',
            ], 404);
        }

        $verifiedCode = CodeReinitialisation::where('utilisateur', $user->id)
            ->where('utilise', true)
            ->where('actif', true)
            ->where('date_expiration', '>', now()->subMinutes(10))
            ->first();

        if (!$verifiedCode) {
            return response()->json([
                'ok'      => false,
                'code'    => 'VERIFICATION_REQUIRED',
                'message' => 'La vérification par code est requise pour modifier le mot de passe.',
            ], 403);
        }

        try {
            $user->password_hash = Hash::make($request->password);
            $user->save();

            CodeReinitialisation::where('utilisateur', $user->id)
                ->update(['actif' => false]);

            TokenChoixRole::where('utilisateur', $user->id)
                ->where('validite', true)
                ->update(['validite' => false]);

            SessionApp::where('utilisateur', $user->id)
                ->where('validite', true)
                ->update(['validite' => false]);
        } catch (\Throwable $e) {
            Log::error('PasswordController@reset error', ['message' => $e->getMessage()]);
            return response()->json([
                'ok'      => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Une erreur est survenue. Réessayez.',
            ], 500);
        }

        return response()->json([
            'ok'      => true,
            'message' => 'Mot de passe modifié avec succès.',
        ], 200);
    }
}
