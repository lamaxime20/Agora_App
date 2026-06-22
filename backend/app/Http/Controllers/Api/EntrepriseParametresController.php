<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CodeCouleur;
use App\Models\Entreprise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EntrepriseParametresController extends Controller
{
    private function formatEntreprise(Entreprise $entreprise): array
    {
        $couleurs = $entreprise->codeCouleur;

        return [
            'id'                  => $entreprise->id,
            'nom'                 => $entreprise->nom,
            'secteur_activite'    => $entreprise->secteur_activite,
            'email'               => $entreprise->email,
            'telephone'           => $entreprise->telephone,
            'site_web'            => $entreprise->site_web,
            'logo'                => $entreprise->logo,
            'pays'                => $entreprise->pays,
            'ville'               => $entreprise->ville,
            'adresse'             => $entreprise->adresse,
            'description'         => $entreprise->description,
            'politique_entreprise'=> $entreprise->politique_entreprise,
            'couleur_primaire'    => $couleurs?->couleur_primaire   ?? '#F39C12',
            'couleur_secondaire'  => $couleurs?->couleur_secondaire ?? '#2C3E50',
            'couleur_tertiaire'   => $couleurs?->couleur_tertiaire  ?? '#27AE60',
        ];
    }

    // GET /api/entreprise/parametres — protégé MiddlewareTokenAuthorization
    public function show(Request $request): JsonResponse
    {
        /** @var Entreprise $entreprise */
        $entreprise = $request->attributes->get('currentEntreprise');

        return response()->json([
            'ok'         => true,
            'entreprise' => $this->formatEntreprise($entreprise),
        ]);
    }

    // PATCH /api/entreprise/parametres — protégé MiddlewareTokenAuthorization
    public function update(Request $request): JsonResponse
    {
        /** @var Entreprise $entreprise */
        $entreprise = $request->attributes->get('currentEntreprise');

        $validator = Validator::make($request->all(), [
            'nom'                  => 'sometimes|required|string|max:255',
            'secteur_activite'     => 'sometimes|nullable|string|max:100',
            'email'                => 'sometimes|nullable|email|max:255',
            'telephone'            => 'sometimes|nullable|string|max:50',
            'site_web'             => 'sometimes|nullable|url|max:255',
            'pays'                 => 'sometimes|nullable|string|max:100',
            'ville'                => 'sometimes|nullable|string|max:100',
            'adresse'              => 'sometimes|nullable|string|max:255',
            'description'          => 'sometimes|nullable|string',
            'politique_entreprise' => 'sometimes|nullable|string',
            'couleur_primaire'     => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'couleur_secondaire'   => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'couleur_tertiaire'    => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ], [
            'nom.required'               => 'Le nom de l\'entreprise est requis.',
            'email.email'                => 'Adresse e-mail invalide.',
            'site_web.url'               => 'URL du site web invalide.',
            'couleur_primaire.regex'     => 'Couleur primaire invalide (ex: #F39C12).',
            'couleur_secondaire.regex'   => 'Couleur secondaire invalide (ex: #2C3E50).',
            'couleur_tertiaire.regex'    => 'Couleur tertiaire invalide (ex: #27AE60).',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'     => false,
                'code'   => 'VALIDATION_ERROR',
                'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
            ], 422);
        }

        try {
            $fields = [
                'nom', 'secteur_activite', 'email', 'telephone',
                'site_web', 'pays', 'ville', 'adresse', 'description', 'politique_entreprise',
            ];

            foreach ($fields as $field) {
                if ($request->has($field)) {
                    $entreprise->$field = $request->input($field);
                }
            }
            $entreprise->save();

            // Update or create color record
            $colorFields = ['couleur_primaire', 'couleur_secondaire', 'couleur_tertiaire'];
            $colorData = [];
            foreach ($colorFields as $field) {
                if ($request->has($field)) {
                    $colorData[$field] = $request->input($field);
                }
            }

            if (!empty($colorData)) {
                CodeCouleur::updateOrCreate(
                    ['entreprise' => $entreprise->id],
                    $colorData
                );
            }

            $entreprise->refresh();

            return response()->json([
                'ok'         => true,
                'message'    => 'Paramètres mis à jour.',
                'entreprise' => $this->formatEntreprise($entreprise),
            ]);
        } catch (\Throwable $e) {
            Log::error('EntrepriseParametresController@update', ['message' => $e->getMessage()]);

            return response()->json([
                'ok'      => false,
                'code'    => 'SERVER_ERROR',
                'message' => 'Erreur lors de la mise à jour.',
            ], 500);
        }
    }
}
