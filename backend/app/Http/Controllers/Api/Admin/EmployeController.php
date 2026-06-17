<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppartenirEntreprise;
use App\Models\Entreprise;
use App\Models\RoleUtilisateur;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EmployeController extends Controller
{
    // Rôles gérables par l'admin (correspondant exactement à roles_utilisateur.role en DB)
    private const ROLES_EMPLOYE = [
        'employe_gestion_stock',
        'employe_vente',
        'employe_finances',
        'employe_livraison',
        'employe_rh',
    ];

    public function index(string $entrepriseId): JsonResponse
    {
        if (!Entreprise::find($entrepriseId)) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Entreprise introuvable.'], 404);
        }

        $roleIds = RoleUtilisateur::whereIn('role', self::ROLES_EMPLOYE)->pluck('id');

        $employes = AppartenirEntreprise::with(['utilisateur', 'roleUtilisateur'])
            ->where('entreprise_id', $entrepriseId)
            ->where('statut', 'actif')
            ->whereIn('role_utilisateur_id', $roleIds)
            ->get()
            ->map(fn($a) => [
                'id'         => $a->utilisateur->id,
                'nom'        => $a->utilisateur->name,
                'prenom'     => $a->utilisateur->prename,
                'email'      => $a->utilisateur->email,
                'role'       => $a->roleUtilisateur->role,
                'date_ajout' => $a->date_enregistrement,
            ]);

        return response()->json(['success' => true, 'data' => $employes->values()]);
    }

    public function checkEmail(Request $request, string $entrepriseId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'code' => 'VALIDATION_ERROR', 'message' => 'Adresse e-mail invalide.'], 422);
        }

        $user = Utilisateur::where('email', $request->email)
            ->where('statut', 'actif')
            ->first();

        return response()->json([
            'success' => true,
            'exists'  => $user !== null,
        ]);
    }

    public function store(Request $request, string $entrepriseId): JsonResponse
    {
        $entreprise = Entreprise::find($entrepriseId);
        if (!$entreprise) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Entreprise introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'email'  => 'required|email',
            'role'   => 'required|string|in:' . implode(',', self::ROLES_EMPLOYE),
            'nom'    => 'nullable|string|max:100',
            'prenom' => 'nullable|string|max:100',
        ], [
            'email.required' => "L'adresse e-mail est requise.",
            'role.required'  => 'Le rôle est requis.',
            'role.in'        => 'Rôle invalide.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'code'    => 'VALIDATION_ERROR',
                'errors'  => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        $role = RoleUtilisateur::where('role', $request->role)->first();
        if (!$role) {
            return response()->json(['success' => false, 'code' => 'ROLE_NOT_FOUND', 'message' => 'Rôle introuvable.'], 404);
        }

        $user = Utilisateur::where('email', $request->email)->first();

        if (!$user) {
            if (!$request->filled('nom') || !$request->filled('prenom')) {
                return response()->json([
                    'success' => false,
                    'code'    => 'USER_DATA_REQUIRED',
                    'message' => 'Le nom et le prénom sont requis pour créer un nouvel utilisateur.',
                ], 422);
            }

            try {
                $user = Utilisateur::create([
                    'email'         => $request->email,
                    'name'          => $request->nom,
                    'prename'       => $request->prenom,
                    'password_hash' => Hash::make('employe237'),
                    'statut'        => 'actif',
                ]);
            } catch (\Throwable $e) {
                Log::error('Admin\\EmployeController@store - create user', ['message' => $e->getMessage()]);
                return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la création.'], 500);
            }
        }

        // Réactiver ou créer l'appartenance
        $existing = AppartenirEntreprise::where('utilisateur_id', $user->id)
            ->where('entreprise_id', $entrepriseId)
            ->where('role_utilisateur_id', $role->id)
            ->first();

        if ($existing) {
            if ($existing->statut === 'actif') {
                return response()->json([
                    'success' => false,
                    'code'    => 'ALREADY_MEMBER',
                    'message' => 'Cet utilisateur est déjà membre avec ce rôle.',
                ], 422);
            }
            $existing->update(['statut' => 'actif', 'date_enregistrement' => now()]);
        } else {
            try {
                AppartenirEntreprise::create([
                    'utilisateur_id'      => $user->id,
                    'entreprise_id'       => $entrepriseId,
                    'role_utilisateur_id' => $role->id,
                    'date_enregistrement' => now(),
                    'statut'              => 'actif',
                ]);
            } catch (\Throwable $e) {
                Log::error('Admin\\EmployeController@store - create membership', ['message' => $e->getMessage()]);
                return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => "Erreur lors de l'ajout."], 500);
            }
        }

        return response()->json(['success' => true, 'message' => 'Employé ajouté avec succès.']);
    }

    public function updateRole(Request $request, string $entrepriseId, string $utilisateurId): JsonResponse
    {
        /** @var \App\Models\Admin $admin */
        $admin = $request->attributes->get('authAdmin');

        $validator = Validator::make($request->all(), [
            'role'     => 'required|string|in:' . implode(',', self::ROLES_EMPLOYE),
            'password' => 'required|string',
        ], [
            'role.required'     => 'Le nouveau rôle est requis.',
            'role.in'           => 'Rôle invalide.',
            'password.required' => 'Le mot de passe est requis pour confirmer.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'code'    => 'VALIDATION_ERROR',
                'errors'  => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        if (!Hash::check($request->password, $admin->password_hash)) {
            return response()->json(['success' => false, 'code' => 'INVALID_PASSWORD', 'message' => 'Mot de passe incorrect.'], 403);
        }

        if (!Utilisateur::find($utilisateurId)) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Utilisateur introuvable.'], 404);
        }

        $nouveauRole = RoleUtilisateur::where('role', $request->role)->first();
        if (!$nouveauRole) {
            return response()->json(['success' => false, 'code' => 'ROLE_NOT_FOUND', 'message' => 'Rôle introuvable.'], 404);
        }

        $roleIds = RoleUtilisateur::whereIn('role', self::ROLES_EMPLOYE)->pluck('id');

        try {
            // Archiver tous les rôles employé actuels
            AppartenirEntreprise::where('utilisateur_id', $utilisateurId)
                ->where('entreprise_id', $entrepriseId)
                ->whereIn('role_utilisateur_id', $roleIds)
                ->update(['statut' => 'archive']);

            // Réactiver ou créer le nouveau rôle
            $existing = AppartenirEntreprise::where('utilisateur_id', $utilisateurId)
                ->where('entreprise_id', $entrepriseId)
                ->where('role_utilisateur_id', $nouveauRole->id)
                ->first();

            if ($existing) {
                $existing->update(['statut' => 'actif', 'date_enregistrement' => now()]);
            } else {
                AppartenirEntreprise::create([
                    'utilisateur_id'      => $utilisateurId,
                    'entreprise_id'       => $entrepriseId,
                    'role_utilisateur_id' => $nouveauRole->id,
                    'date_enregistrement' => now(),
                    'statut'              => 'actif',
                ]);
            }

            return response()->json(['success' => true, 'message' => 'Rôle mis à jour.']);
        } catch (\Throwable $e) {
            Log::error('Admin\\EmployeController@updateRole', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors de la mise à jour.'], 500);
        }
    }

    public function destroy(Request $request, string $entrepriseId, string $utilisateurId): JsonResponse
    {
        /** @var \App\Models\Admin $admin */
        $admin = $request->attributes->get('authAdmin');

        if (!$request->filled('password')) {
            return response()->json(['success' => false, 'code' => 'VALIDATION_ERROR', 'message' => 'Le mot de passe est requis.'], 422);
        }

        if (!Hash::check($request->password, $admin->password_hash)) {
            return response()->json(['success' => false, 'code' => 'INVALID_PASSWORD', 'message' => 'Mot de passe incorrect.'], 403);
        }

        $roleIds = RoleUtilisateur::whereIn('role', self::ROLES_EMPLOYE)->pluck('id');

        $count = AppartenirEntreprise::where('utilisateur_id', $utilisateurId)
            ->where('entreprise_id', $entrepriseId)
            ->whereIn('role_utilisateur_id', $roleIds)
            ->where('statut', 'actif')
            ->count();

        if ($count === 0) {
            return response()->json(['success' => false, 'code' => 'NOT_FOUND', 'message' => 'Employé introuvable.'], 404);
        }

        try {
            AppartenirEntreprise::where('utilisateur_id', $utilisateurId)
                ->where('entreprise_id', $entrepriseId)
                ->whereIn('role_utilisateur_id', $roleIds)
                ->update(['statut' => 'archive']);

            return response()->json(['success' => true, 'message' => 'Employé retiré avec succès.']);
        } catch (\Throwable $e) {
            Log::error('Admin\\EmployeController@destroy', ['message' => $e->getMessage()]);

            return response()->json(['success' => false, 'code' => 'SERVER_ERROR', 'message' => 'Erreur lors du retrait.'], 500);
        }
    }
}
