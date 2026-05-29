<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEntrepriseRequest;
use App\Models\AppartenirEntreprise;
use App\Models\CodeCouleur;
use App\Models\Entreprise;
use App\Models\RoleUtilisateur;
use App\Models\SessionApp;
use App\Models\TokenChoixRole;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class EntrepriseController extends Controller
{
    // POST /api/entreprises — protégé par tokenAuth ou tokenAuthorization
    public function store(StoreEntrepriseRequest $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $request->attributes->get('authUser');
        /** @var SessionApp|TokenChoixRole $authToken */
        $authToken = $request->attributes->get('authToken');
        $authCookieName = $request->attributes->get('authCookieName');

        $nomEntreprise = trim((string) $request->input('nom'));

        $duplicate = Entreprise::where('directeur', $user->id)
            ->whereRaw('LOWER(nom) = ?', [mb_strtolower($nomEntreprise)])
            ->where('statut', 'actif')
            ->first();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'code'    => 'DUPLICATE_ENTREPRISE',
                'message' => 'Vous possédez déjà une entreprise avec ce nom.',
            ], 409);
        }

        $storedLogoPath = null;

        $couleurPrimaire = $request->filled('couleur_primaire') ? $request->input('couleur_primaire') : '#FFF';
        $couleurSecondaire = $request->filled('couleur_secondaire') ? $request->input('couleur_secondaire') : '#000';
        $couleurTertiaire = $request->filled('couleur_tertiaire') ? $request->input('couleur_tertiaire') : '#F0F0F0';
        $siteWeb = $request->filled('site_web') ? $request->input('site_web') : null;

        $entreprise = null;
        $codeCouleur = null;
        $appartenance = null;
        $session = null;
        $roleDirecteur = null;

        try {
            $logoUrl = null;

            if ($request->hasFile('logo')) {
                $storedLogoPath = $request->file('logo')->store('logos', 'public');
                $logoUrl = url(Storage::disk('public')->url($storedLogoPath));
            }

            $entreprise = Entreprise::create([
                'nom'                 => $nomEntreprise,
                'logo'                => $logoUrl,
                'email'               => $request->input('email'),
                'telephone'           => $request->input('telephone'),
                'site_web'            => $siteWeb,
                'pays'                => $request->input('pays'),
                'ville'               => $request->input('ville'),
                'adresse'             => $request->input('adresse'),
                'secteur_activite'    => $request->input('secteur'),
                'description'         => $request->input('description'),
                'politique_entreprise'=> $request->input('politique'),
                'argent_virtuel'      => 0,
                'statut'              => 'actif',
                'directeur'           => $user->id,
            ]);

            $codeCouleur = CodeCouleur::create([
                'couleur_primaire'   => $couleurPrimaire,
                'couleur_secondaire' => $couleurSecondaire,
                'couleur_tertiaire'  => $couleurTertiaire,
                'entreprise'         => $entreprise->id,
            ]);

            $roleDirecteur = RoleUtilisateur::whereRaw('LOWER(role) = ?', ['directeur'])->first();

            if (!$roleDirecteur) {
                throw new \RuntimeException('Le rôle Directeur est introuvable.');
            }

            $appartenance = AppartenirEntreprise::create([
                'utilisateur_id'      => $user->id,
                'entreprise_id'       => $entreprise->id,
                'role_utilisateur_id' => $roleDirecteur->id,
                'date_enregistrement' => now(),
                'statut'              => 'actif',
            ]);

            if ($authCookieName === 'tokenAuthorization') {
                SessionApp::where('id', $authToken->id)->update(['validite' => false]);
            } else {
                TokenChoixRole::where('id', $authToken->id)->update(['validite' => false]);
            }

            $ttlMinutes = (int) env('TOKEN_AUTHORIZATION_TTL_HOURS', 8) * 60;
            $tokenValue = bin2hex(random_bytes(40));
            $expiration = now()->addMinutes($ttlMinutes);

            $session = SessionApp::create([
                'token'           => $tokenValue,
                'role'            => $roleDirecteur->id,
                'entreprise'      => $entreprise->id,
                'utilisateur'     => $user->id,
                'validite'        => true,
                'date_creation'   => now(),
                'date_expiration' => $expiration,
            ]);

            $authorizationCookie = cookie(
                'tokenAuthorization',
                $tokenValue,
                $ttlMinutes,
                '/',
                null,
                (bool) config('session.secure', $request->isSecure()),
                true,
                false,
                config('session.same_site', 'none')
            );

            $response = response()->json([
                'success'    => true,
                'message'    => 'Entreprise créée avec succès.',
                'entreprise' => [
                    'id'                 => $entreprise->id,
                    'nom'                => $entreprise->nom,
                    'secteur'            => $entreprise->secteur_activite,
                    'email'              => $entreprise->email,
                    'telephone'          => $entreprise->telephone,
                    'site_web'           => $entreprise->site_web,
                    'logo'               => $entreprise->logo,
                    'couleur_primaire'   => $codeCouleur->couleur_primaire,
                    'couleur_secondaire' => $codeCouleur->couleur_secondaire,
                    'couleur_tertiaire'  => $codeCouleur->couleur_tertiaire,
                    'pays'               => $entreprise->pays,
                    'ville'              => $entreprise->ville,
                    'adresse'            => $entreprise->adresse,
                    'politique'          => $entreprise->politique_entreprise,
                    'description'        => $entreprise->description,
                    'created_at'         => now()->toIso8601String(),
                ],
            ], 201)->withCookie($authorizationCookie);

            if ($authCookieName === 'tokenAuth') {
                $expiredAuthCookie = cookie(
                    'tokenAuth',
                    '',
                    -1,
                    '/',
                    null,
                    (bool) config('session.secure', $request->isSecure()),
                    true,
                    false,
                    config('session.same_site', 'none')
                );

                $response = $response->withCookie($expiredAuthCookie);
            }

            return $response;
        } catch (\Throwable $e) {
            if ($session) {
                SessionApp::where('id', $session->id)->delete();
            }

            if ($appartenance) {
                AppartenirEntreprise::where('utilisateur_id', $appartenance->utilisateur_id)
                    ->where('entreprise_id', $appartenance->entreprise_id)
                    ->where('role_utilisateur_id', $appartenance->role_utilisateur_id)
                    ->delete();
            }

            if ($codeCouleur) {
                CodeCouleur::where('id', $codeCouleur->id)->delete();
            }

            if ($entreprise) {
                Entreprise::where('id', $entreprise->id)->delete();
            }

            if ($storedLogoPath) {
                Storage::disk('public')->delete($storedLogoPath);
            }

            if ($authCookieName === 'tokenAuthorization') {
                SessionApp::where('id', $authToken->id)->update(['validite' => true]);
            } else {
                TokenChoixRole::where('id', $authToken->id)->update(['validite' => true]);
            }

            Log::error('EntrepriseController@store error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Une erreur interne est survenue. Réessayez dans quelques instants.',
            ], 500);
        }
    }

    // GET /api/user/entreprises — protégé MiddlewareTokenAuth
    public function userEntreprises(Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $request->attributes->get('authUser');

        $rows = DB::table('appartenir_entreprise as ae')
            ->join('entreprises as e', 'ae.entreprise_id', '=', 'e.id')
            ->leftJoin('codes_couleurs as cc', 'cc.entreprise', '=', 'e.id')
            ->join('roles_utilisateur as ru', 'ae.role_utilisateur_id', '=', 'ru.id')
            ->where('ae.utilisateur_id', $user->id)
            ->where('ae.statut', 'actif')
            ->where('e.statut', 'actif')
            ->orderBy('e.nom')
            ->orderBy('ru.role')
            ->select([
                'e.id',
                'e.nom',
                'e.logo',
                'e.statut',
                'cc.couleur_primaire',
                'cc.couleur_secondaire',
                'cc.couleur_tertiaire',
                'ru.id as role_id',
                'ru.role as role_nom',
                'ru.description as role_description',
            ])
            ->get();

        $entreprisesMap = [];

        foreach ($rows as $row) {
            if (!isset($entreprisesMap[$row->id])) {
                $entreprisesMap[$row->id] = [
                    'id'                 => $row->id,
                    'nom'                => $row->nom,
                    'logo'               => $row->logo,
                    'couleur_primaire'   => $row->couleur_primaire   ?? '#FFF',
                    'couleur_secondaire' => $row->couleur_secondaire ?? '#000',
                    'couleur_tertiaire'  => $row->couleur_tertiaire  ?? '#F0F0F0',
                    'statut'             => $row->statut,
                    'roles'              => [],
                ];
            }

            $entreprisesMap[$row->id]['roles'][] = [
                'id'          => $row->role_id,
                'nom'         => $row->role_nom,
                'description' => $row->role_description,
                'icone'       => $this->getRoleIcon($row->role_nom),
            ];
        }

        return response()->json([
            'ok'          => true,
            'entreprises' => array_values($entreprisesMap),
        ], 200);
    }

    private function getRoleIcon(string $roleName): string
    {
        $map = [
            'directeur'                => 'Crown',
            'manager_gestion_stock'    => 'Package',
            'employe_gestion_stock'    => 'Package',
            'manager_vente'            => 'LayoutDashboard',
            'employe_vente'            => 'ShoppingCart',
            'manager_finances'         => 'Wallet',
            'employe_finances'         => 'Calculator',
        ];

        return $map[mb_strtolower(trim($roleName))] ?? 'CircleUserRound';
    }
}
