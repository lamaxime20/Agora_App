<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CodeOtp;
use App\Models\TokenChoixRole;
use App\Models\Utilisateur;
use App\Support\MailerService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SignupController extends Controller
{
    public function checkEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'    => 'required|string|min:2',
            'prenom' => 'required|string|min:2',
            'email'  => 'required|email|max:255',
        ], [
            'nom.required'    => 'Le nom est requis.',
            'nom.min'         => 'Le nom doit contenir au moins 2 caractères.',
            'prenom.required' => 'Le prénom est requis.',
            'prenom.min'      => 'Le prénom doit contenir au moins 2 caractères.',
            'email.required'  => 'L\'adresse e-mail est requise.',
            'email.email'     => 'Adresse e-mail invalide.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'     => false,
                'code'   => 'VALIDATION_ERROR',
                'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        $existing = Utilisateur::where('email', $request->email)->first();

        if ($existing && $existing->statut === 'actif') {
            return response()->json([
                'ok'      => false,
                'code'    => 'EMAIL_ALREADY_USED',
                'message' => 'Un compte actif existe déjà avec cette adresse e-mail.',
            ], 409);
        }

        $code           = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $dateExpiration = now()->addMinutes(10);

        try {
            CodeOtp::where('email', $request->email)
                ->where('utilise', false)
                ->update(['actif' => false]);

            CodeOtp::create([
                'code'            => $code,
                'email'           => $request->email,
                'date_expiration' => $dateExpiration,
                'utilise'         => false,
                'actif'           => true,
            ]);

            $mailer   = new MailerService();
            $fullName = $request->prenom . ' ' . $request->nom;
            $sent     = $mailer->sendOtpEmail($request->email, $fullName, $code);

            if (!$sent) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'SERVER_ERROR',
                    'message' => 'Impossible d\'envoyer le code pour le moment. Réessayez.',
                ], 500);
            }
        } catch (\Throwable $e) {
            Log::error('SignupController@checkEmail error', ['message' => $e->getMessage()]);
            return response()->json([
                'ok'      => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Impossible d\'envoyer le code pour le moment. Réessayez.',
            ], 500);
        }

        return response()->json([
            'ok'      => true,
            'message' => 'Un code de vérification a été envoyé à votre adresse e-mail.',
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

        $record = CodeOtp::where('email', $request->email)
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
                'message' => 'Le code de vérification a expiré. Recommencez depuis le début.',
            ], 410);
        }

        if (!hash_equals($record->code, $request->code)) {
            return response()->json([
                'ok'      => false,
                'code'    => 'INVALID_CODE',
                'message' => 'Code de vérification incorrect.',
            ], 422);
        }

        $record->update(['utilise' => true]);

        return response()->json([
            'ok'      => true,
            'message' => 'Code de vérification validé.',
        ], 200);
    }

    public function create(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'      => 'required|string|min:2',
            'prenom'   => 'required|string|min:2',
            'email'    => 'required|email|max:255',
            'password' => 'required|string|min:8',
        ], [
            'nom.required'      => 'Le nom est requis.',
            'prenom.required'   => 'Le prénom est requis.',
            'email.required'    => 'L\'adresse e-mail est requise.',
            'email.email'       => 'Adresse e-mail invalide.',
            'password.required' => 'Le mot de passe est requis.',
            'password.min'      => 'Au moins 8 caractères requis.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'     => false,
                'code'   => 'VALIDATION_ERROR',
                'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        $verifiedCode = CodeOtp::where('email', $request->email)
            ->where('utilise', true)
            ->where('actif', true)
            ->where('date_expiration', '>', now()->subMinutes(30))
            ->first();

        if (!$verifiedCode) {
            return response()->json([
                'ok'      => false,
                'code'    => 'VERIFICATION_REQUIRED',
                'message' => 'La vérification de l\'e-mail est requise avant la création du compte.',
            ], 403);
        }

        $existing = Utilisateur::where('email', $request->email)->first();
        if ($existing && $existing->statut === 'actif') {
            return response()->json([
                'ok'      => false,
                'code'    => 'EMAIL_ALREADY_USED',
                'message' => 'Un compte actif existe déjà avec cette adresse e-mail.',
            ], 409);
        }

        try {
            $ttlMinutes = (int) env('TOKEN_AUTH_TTL_HOURS', 24) * 60;
            $tokenValue = bin2hex(random_bytes(40));
            $expiration = now()->addMinutes($ttlMinutes);

            $user = Utilisateur::create([
                'email'         => $request->email,
                'password_hash' => Hash::make($request->password),
                'name'          => $request->nom,
                'prename'       => $request->prenom,
                'statut'        => 'actif',
            ]);

            CodeOtp::where('email', $request->email)
                ->where('utilise', true)
                ->update(['actif' => false]);

            TokenChoixRole::create([
                'token'           => $tokenValue,
                'utilisateur'     => $user->id,
                'validite'        => true,
                'date_creation'   => now(),
                'date_expiration' => $expiration,
            ]);

            $cookie = cookie(
                'tokenAuth',
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
                'message' => 'Compte créé avec succès.',
                'user'    => [
                    'email'      => $user->email,
                    'nom'        => $user->name,
                    'prenom'     => $user->prename,
                    'expires_at' => $expiration->toIso8601String(),
                ],
            ], 201)->withCookie($cookie);
        } catch (\Throwable $e) {
            Log::error('SignupController@create error', ['message' => $e->getMessage()]);
            return response()->json([
                'ok'      => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Une erreur est survenue. Réessayez.',
            ], 500);
        }
    }
}
