<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppartenirEntreprise;
use App\Models\CodeCouleur;
use App\Models\Entreprise;
use App\Models\RoleUtilisateur;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EntrepriseController extends Controller
{
    public function index(): JsonResponse
    {
        $entreprises = Entreprise::all();

        return response()->json([
            'success' => true,
            'data'    => $entreprises->map(fn($e) => [
                'id'      => $e->id,
                'name'    => $e->nom,
                'secteur' => $e->secteur_activite,
                'logo'    => $e->logo,
            ])->values(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $entreprise = Entreprise::find($id);

        if (!$entreprise) {
            return response()->json([
                'success' => false,
                'code'    => 'NOT_FOUND',
                'message' => 'Entreprise introuvable.',
            ], 404);
        }

        $couleurs = $entreprise->codeCouleur;

        return response()->json([
            'success' => true,
            'data'    => [
                'id'          => $entreprise->id,
                'name'        => $entreprise->nom,
                'secteur'     => $entreprise->secteur_activite,
                'logo'        => $entreprise->logo,
                'colors'      => [
                    $couleurs?->couleur_primaire   ?? '#F39C12',
                    $couleurs?->couleur_secondaire ?? '#2C3E50',
                    $couleurs?->couleur_tertiaire  ?? '#27AE60',
                ],
                'email'       => $entreprise->email,
                'phone'       => $entreprise->telephone,
                'website'     => $entreprise->site_web,
                'country'     => $entreprise->pays,
                'city'        => $entreprise->ville,
                'address'     => $entreprise->adresse,
                'description' => $entreprise->description,
                'policy'      => $entreprise->politique_entreprise,
            ],
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:255',
            'secteur'     => 'required|string|max:150',
            'email'       => 'required|email|max:255',
            'phone'       => 'required|string|max:30',
            'website'     => 'nullable|string|max:500',
            'country'     => 'required|string|max:100',
            'city'        => 'required|string|max:100',
            'address'     => 'required|string',
            'description' => 'required|string',
            'policy'      => 'required|string',
            'logo'        => 'nullable|string',
            'color1'      => 'nullable|string|max:20',
            'color2'      => 'nullable|string|max:20',
            'color3'      => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'code'    => 'VALIDATION_ERROR',
                'errors'  => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        $entreprise = Entreprise::find($id);

        if (!$entreprise) {
            return response()->json([
                'success' => false,
                'code'    => 'NOT_FOUND',
                'message' => 'Entreprise introuvable.',
            ], 404);
        }

        try {
            $entreprise->update([
                'nom'                  => $request->name,
                'secteur_activite'     => $request->secteur,
                'logo'                 => $request->logo,
                'email'                => $request->email,
                'telephone'            => $request->phone,
                'site_web'             => $request->website,
                'pays'                 => $request->country,
                'ville'                => $request->city,
                'adresse'              => $request->address,
                'description'          => $request->description,
                'politique_entreprise' => $request->policy,
            ]);

            $couleurs    = $entreprise->codeCouleur;
            $colorsData  = [
                'couleur_primaire'   => $request->color1 ?? '#F39C12',
                'couleur_secondaire' => $request->color2 ?? '#2C3E50',
                'couleur_tertiaire'  => $request->color3 ?? '#27AE60',
            ];

            if ($couleurs) {
                $couleurs->update($colorsData);
            } else {
                CodeCouleur::create(array_merge($colorsData, ['entreprise' => $entreprise->id]));
            }

            return response()->json([
                'success' => true,
                'message' => 'Entreprise mise à jour avec succès.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Admin\\EntrepriseController@update', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Une erreur est survenue. Réessayez.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'         => 'required|string|max:255',
            'secteur'     => 'required|string|max:150',
            'email'       => 'required|email|max:255',
            'phone'       => 'required|string|max:30',
            'website'     => 'nullable|string|max:500',
            'country'     => 'required|string|max:100',
            'city'        => 'required|string|max:100',
            'address'     => 'required|string',
            'description' => 'required|string',
            'policy'      => 'required|string',
            'logo'        => 'nullable|string',
            'color1'      => 'nullable|string|max:20',
            'color2'      => 'nullable|string|max:20',
            'color3'      => 'nullable|string|max:20',
            'directeur'   => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'code'    => 'VALIDATION_ERROR',
                'errors'  => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        $directeur = Utilisateur::where('email', $request->directeur)
            ->where('statut', 'actif')
            ->first();

        if (!$directeur) {
            return response()->json([
                'success' => false,
                'code'    => 'DIRECTEUR_NOT_FOUND',
                'message' => "Aucun utilisateur actif trouvé avec l'e-mail du directeur.",
            ], 404);
        }

        $roleDirecteur = RoleUtilisateur::where('role', 'directeur')->first();

        if (!$roleDirecteur) {
            return response()->json([
                'success' => false,
                'code'    => 'ROLE_NOT_FOUND',
                'message' => 'Rôle directeur introuvable en base.',
            ], 500);
        }

        try {
            $entreprise = Entreprise::create([
                'nom'                  => $request->nom,
                'secteur_activite'     => $request->secteur,
                'logo'                 => $request->logo,
                'email'                => $request->email,
                'telephone'            => $request->phone,
                'site_web'             => $request->website,
                'pays'                 => $request->country,
                'ville'                => $request->city,
                'adresse'              => $request->address,
                'description'          => $request->description,
                'politique_entreprise' => $request->policy,
                'directeur'            => $directeur->id,
            ]);

            CodeCouleur::create([
                'couleur_primaire'   => $request->color1 ?? '#F39C12',
                'couleur_secondaire' => $request->color2 ?? '#2C3E50',
                'couleur_tertiaire'  => $request->color3 ?? '#27AE60',
                'entreprise'         => $entreprise->id,
            ]);

            $existingMembership = AppartenirEntreprise::where('utilisateur_id', $directeur->id)
                ->where('entreprise_id', $entreprise->id)
                ->where('role_utilisateur_id', $roleDirecteur->id)
                ->first();

            if ($existingMembership) {
                $existingMembership->update(['statut' => 'actif', 'date_enregistrement' => now()]);
            } else {
                AppartenirEntreprise::create([
                    'utilisateur_id'      => $directeur->id,
                    'entreprise_id'       => $entreprise->id,
                    'role_utilisateur_id' => $roleDirecteur->id,
                    'date_enregistrement' => now(),
                    'statut'              => 'actif',
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Entreprise créée avec succès.',
                'data'    => ['id' => $entreprise->id],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Admin\\EntrepriseController@store', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Une erreur est survenue lors de la création.',
            ], 500);
        }
    }

    public function searchUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'code'    => 'VALIDATION_ERROR',
                'message' => 'Adresse e-mail invalide.',
            ], 422);
        }

        $user = Utilisateur::where('email', $request->email)
            ->where('statut', 'actif')
            ->first();

        return response()->json([
            'success' => true,
            'exists'  => $user !== null,
            'user'    => $user ? [
                'id'     => $user->id,
                'nom'    => $user->name,
                'prenom' => $user->prename,
                'email'  => $user->email,
            ] : null,
        ]);
    }

    public function createDirecteur(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'  => 'required|email|unique:utilisateurs,email',
            'nom'    => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
        ], [
            'email.required' => "L'adresse e-mail est requise.",
            'email.email'    => 'Adresse e-mail invalide.',
            'email.unique'   => 'Un compte existe déjà avec cet e-mail.',
            'nom.required'   => 'Le nom est requis.',
            'prenom.required'=> 'Le prénom est requis.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'code'    => 'VALIDATION_ERROR',
                'errors'  => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        $defaultPassword = 'directeur237';

        try {
            Utilisateur::create([
                'email'         => $request->email,
                'name'          => $request->nom,
                'prename'       => $request->prenom,
                'password_hash' => Hash::make($defaultPassword),
                'statut'        => 'actif',
            ]);

            return response()->json([
                'success'         => true,
                'message'         => 'Directeur créé avec succès.',
                'defaultPassword' => $defaultPassword,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Admin\\EntrepriseController@createDirecteur', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Erreur lors de la création du directeur.',
            ], 500);
        }
    }
}
