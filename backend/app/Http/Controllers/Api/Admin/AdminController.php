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

class AdminController extends Controller
{
    public function index(): JsonResponse
    {
        $admins = Admin::orderBy('created_at')->get();

        return response()->json([
            'success' => true,
            'data'    => $admins->map(fn($a) => [
                'id'         => $a->id,
                'email'      => $a->email,
                'originel'   => (bool) $a->originel,
                'actif'      => $a->statut === 'actif',
                'created_at' => $a->created_at,
            ])->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Admin $authAdmin */
        $authAdmin = $request->attributes->get('authAdmin');

        if (!$authAdmin->originel) {
            return response()->json([
                'success' => false,
                'code'    => 'FORBIDDEN',
                'message' => 'Seul un administrateur originel peut ajouter un administrateur.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'email'                 => 'required|email|unique:admins,email',
            'password'              => 'required|string|min:8',
            'password_confirmation' => 'required|same:password',
        ], [
            'email.required'                 => "L'adresse e-mail est requise.",
            'email.email'                    => 'Adresse e-mail invalide.',
            'email.unique'                   => 'Cet e-mail est déjà utilisé par un administrateur.',
            'password.required'              => 'Le mot de passe est requis.',
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

        try {
            Admin::create([
                'email'         => $request->email,
                'password_hash' => Hash::make($request->password),
                'originel'      => false,
                'statut'        => 'actif',
            ]);

            return response()->json(['success' => true, 'message' => 'Administrateur ajouté avec succès.'], 201);
        } catch (\Throwable $e) {
            Log::error('Admin\\AdminController@store', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la création.'], 500);
        }
    }

    public function resetPassword(Request $request, string $id): JsonResponse
    {
        /** @var Admin $authAdmin */
        $authAdmin = $request->attributes->get('authAdmin');

        if (!$authAdmin->originel) {
            return response()->json(['success' => false, 'code' => 'FORBIDDEN', 'message' => 'Accès refusé.'], 403);
        }

        $admin = Admin::find($id);
        if (!$admin) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Administrateur introuvable.'], 404);
        }

        if ($admin->id === $authAdmin->id) {
            return response()->json([
                'success' => false,
                'code'    => 'SELF_RESET',
                'message' => 'Utilisez les paramètres pour modifier votre propre mot de passe.',
            ], 422);
        }

        try {
            $newPassword = bin2hex(random_bytes(6));

            $admin->password_hash = Hash::make($newPassword);
            $admin->save();

            TokenAdmin::where('admin', $admin->id)
                ->where('validite', true)
                ->update(['validite' => false]);

            return response()->json([
                'success'              => true,
                'message'              => 'Mot de passe réinitialisé.',
                'nouveau_mot_de_passe' => $newPassword,
            ]);
        } catch (\Throwable $e) {
            Log::error('Admin\\AdminController@resetPassword', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la réinitialisation.'], 500);
        }
    }

    public function disable(Request $request, string $id): JsonResponse
    {
        /** @var Admin $authAdmin */
        $authAdmin = $request->attributes->get('authAdmin');

        if (!$authAdmin->originel) {
            return response()->json(['success' => false, 'code' => 'FORBIDDEN', 'message' => 'Accès refusé.'], 403);
        }

        if (!$request->filled('password')) {
            return response()->json(['success' => false, 'code' => 'VALIDATION_ERROR', 'message' => 'Le mot de passe est requis.'], 422);
        }

        if (!Hash::check($request->password, $authAdmin->password_hash)) {
            return response()->json(['success' => false, 'code' => 'INVALID_PASSWORD', 'message' => 'Mot de passe incorrect.'], 403);
        }

        $admin = Admin::find($id);
        if (!$admin) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Administrateur introuvable.'], 404);
        }

        if ($admin->id === $authAdmin->id) {
            return response()->json(['success' => false, 'code' => 'SELF_DISABLE', 'message' => 'Vous ne pouvez pas désactiver votre propre compte.'], 422);
        }

        if ($admin->originel) {
            return response()->json(['success' => false, 'code' => 'CANNOT_DISABLE_ORIGINEL', 'message' => 'Un administrateur originel ne peut pas être désactivé.'], 403);
        }

        try {
            $admin->statut = 'archive';
            $admin->save();

            TokenAdmin::where('admin', $admin->id)
                ->where('validite', true)
                ->update(['validite' => false]);

            return response()->json(['success' => true, 'message' => 'Administrateur désactivé.']);
        } catch (\Throwable $e) {
            Log::error('Admin\\AdminController@disable', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la désactivation.'], 500);
        }
    }
}
