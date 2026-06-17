<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CodeReinitialisationAdmin;
use App\Models\TokenAdmin;
use App\Support\MailerService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required'    => 'L\'adresse e-mail est requise.',
            'email.email'       => 'Adresse e-mail invalide.',
            'password.required' => 'Le mot de passe est requis.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'      => false,
                'code'    => 'INVALID_CREDENTIALS',
                'message' => 'Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.',
            ], 422);
        }

        $admin = Admin::where('email', $request->email)->first();

        if (!$admin) {
            return response()->json([
                'ok'      => false,
                'code'    => 'INVALID_CREDENTIALS',
                'message' => 'Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.',
            ], 422);
        }

        if ($admin->statut === 'archive') {
            return response()->json([
                'ok'      => false,
                'code'    => 'ACCOUNT_ARCHIVED',
                'message' => 'Ce compte administrateur est désactivé.',
            ], 403);
        }

        if (!Hash::check($request->password, $admin->password_hash)) {
            return response()->json([
                'ok'      => false,
                'code'    => 'INVALID_CREDENTIALS',
                'message' => 'Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.',
            ], 422);
        }

        try {
            $ttlMinutes = (int) env('TOKEN_ADMIN_TTL_HOURS', 24) * 60;
            $tokenValue = bin2hex(random_bytes(40));
            $expiration = now()->addMinutes($ttlMinutes);

            TokenAdmin::where('admin', $admin->id)
                ->where('validite', true)
                ->update(['validite' => false]);

            TokenAdmin::create([
                'token'           => $tokenValue,
                'admin'           => $admin->id,
                'validite'        => true,
                'date_creation'   => now(),
                'date_expiration' => $expiration,
            ]);

            $cookie = cookie(
                'tokenAdmin',
                $tokenValue,
                $ttlMinutes,
                '/',
                null,
                (bool) config('session.secure', $request->isSecure()),
                true,
                false,
                config('session.same_site', 'none')
            );

            return response()->json([
                'ok'      => true,
                'message' => 'Connexion administrateur réussie.',
                'admin'   => [
                    'email'      => $admin->email,
                    'originel'   => $admin->originel,
                    'expires_at' => $expiration->toIso8601String(),
                ],
            ], 200)->withCookie($cookie);
        } catch (\Throwable $e) {
            Log::error('Admin\\AuthController@login error', ['message' => $e->getMessage()]);

            return response()->json([
                'ok'      => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Une erreur est survenue. Réessayez.',
            ], 500);
        }
    }

    public function me(Request $request): JsonResponse
    {
        /** @var Admin $admin */
        $admin = $request->attributes->get('authAdmin');
        /** @var TokenAdmin $token */
        $token = $request->attributes->get('authToken');

        return response()->json([
            'ok'    => true,
            'admin' => [
                'email'      => $admin->email,
                'originel'   => $admin->originel,
                'expires_at' => Carbon::parse($token->date_expiration)->toIso8601String(),
            ],
        ], 200);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var TokenAdmin $token */
        $token = $request->attributes->get('authToken');

        $updated = TokenAdmin::where('id', $token->id)
            ->update(['validite' => false]);

        if (!$updated) {
            return response()->json([
                'ok'      => false,
                'code'    => 'LOGOUT_FAILED',
                'message' => 'Déconnexion impossible, vérifiez votre connexion.',
            ], 500);
        }

        $expiredCookie = cookie(
            'tokenAdmin',
            '',
            -1,
            '/',
            null,
            (bool) config('session.secure', $request->isSecure()),
            true,
            false,
            config('session.same_site', 'none')
        );

        return response()->json([
            'ok'      => true,
            'message' => 'Déconnecté.',
        ], 200)->withCookie($expiredCookie);
    }

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

        $admin = Admin::where('email', $request->email)
            ->where('statut', 'actif')
            ->first();

        if (!$admin) {
            return response()->json([
                'ok'      => false,
                'code'    => 'EMAIL_NOT_FOUND',
                'message' => 'Aucun compte actif n\'existe avec cette adresse e-mail.',
            ], 404);
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiration = now()->addHour();

        try {
            CodeReinitialisationAdmin::where('admin', $admin->id)
                ->where('utilise', false)
                ->update(['actif' => false]);

            CodeReinitialisationAdmin::create([
                'code'            => $code,
                'admin'           => $admin->id,
                'date_expiration' => $expiration,
                'utilise'         => false,
                'actif'           => true,
            ]);

            $mailer = new MailerService();
            $sent = $mailer->sendPasswordResetEmail($admin->email, 'Administrateur', $code);

            if (!$sent) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'SERVER_ERROR',
                    'message' => 'Impossible d\'envoyer le code pour le moment. Réessayez.',
                ], 500);
            }
        } catch (\Throwable $e) {
            Log::error('Admin\\AuthController@sendCode error', ['message' => $e->getMessage()]);

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

        $admin = Admin::where('email', $request->email)
            ->where('statut', 'actif')
            ->first();

        if (!$admin) {
            return response()->json([
                'ok'      => false,
                'code'    => 'CODE_NOT_FOUND',
                'message' => 'Aucun code actif pour cette adresse e-mail.',
            ], 404);
        }

        $record = CodeReinitialisationAdmin::where('admin', $admin->id)
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

        $admin = Admin::where('email', $request->email)
            ->where('statut', 'actif')
            ->first();

        if (!$admin) {
            return response()->json([
                'ok'      => false,
                'code'    => 'ADMIN_NOT_FOUND',
                'message' => 'Aucun compte actif n\'existe avec cette adresse e-mail.',
            ], 404);
        }

        $verifiedCode = CodeReinitialisationAdmin::where('admin', $admin->id)
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
            $admin->password_hash = Hash::make($request->password);
            $admin->save();

            CodeReinitialisationAdmin::where('admin', $admin->id)
                ->update(['actif' => false]);

            TokenAdmin::where('admin', $admin->id)
                ->where('validite', true)
                ->update(['validite' => false]);
        } catch (\Throwable $e) {
            Log::error('Admin\\AuthController@reset error', ['message' => $e->getMessage()]);

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
