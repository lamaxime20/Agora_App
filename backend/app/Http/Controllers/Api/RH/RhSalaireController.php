<?php

namespace App\Http\Controllers\Api\RH;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RhSalaireController extends RhBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 5 — PATCH /api/rh/employes/{id}/salaire
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Définir ou modifier le salaire d'un employé.
     *
     * Path param : id = utilisateur_id (UUID)
     * Body       : { montant: number }
     *
     * Logique :
     *  - Archive le salaire actif existant (date_fin = aujourd'hui, statut = 'archive')
     *  - Crée un nouveau salaire avec le montant fourni et date_debut = aujourd'hui
     *  - Le directeur est exclu
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $directeurId  = $entreprise->directeur;
            $currentUser  = $this->currentUser($request);

            // ── Validation ────────────────────────────────────────────────────
            $montantRaw = $request->input('montant');

            if ($montantRaw === null || $montantRaw === '') {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'VALIDATION_ERROR',
                    'errors'  => ['montant' => 'Le montant est obligatoire.'],
                ], 422);
            }

            $montant = (float) $montantRaw;

            if ($montant < 0) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'VALIDATION_ERROR',
                    'errors'  => ['montant' => 'Le montant doit être supérieur ou égal à 0.'],
                ], 422);
            }

            // ── Vérification : l'employé appartient bien à l'entreprise ───────
            $membre = DB::table('appartenir_entreprise as ae')
                ->join('roles_utilisateur as r', 'r.id', '=', 'ae.role_utilisateur_id')
                ->where('ae.utilisateur_id', $id)
                ->where('ae.entreprise_id', $entrepriseId)
                ->where('ae.statut', 'actif')
                ->where('ae.utilisateur_id', '!=', $directeurId)
                ->where('r.role', '!=', 'directeur')
                ->exists();

            if (!$membre) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Employé introuvable ou non autorisé.',
                ], 404);
            }

            DB::beginTransaction();

            // ── Archivage du salaire actif existant ───────────────────────────
            $ancienMontant = null;
            $ancienSalaire = DB::table('salaires')
                ->where('utilisateur', $id)
                ->where('entreprise', $entrepriseId)
                ->where('statut', 'actif')
                ->where('actif', true)
                ->orderBy('date_debut', 'desc')
                ->first(['id', 'montant']);

            if ($ancienSalaire) {
                $ancienMontant = (float) $ancienSalaire->montant;
                DB::table('salaires')
                    ->where('id', $ancienSalaire->id)
                    ->update([
                        'statut'   => 'archive',
                        'date_fin' => now()->toDateString(),
                    ]);
            }

            // ── Création du nouveau salaire ───────────────────────────────────
            $nouveauSalaireId = (string) Str::uuid();
            DB::table('salaires')->insert([
                'id'         => $nouveauSalaireId,
                'montant'    => $montant,
                'date_debut' => now()->toDateString(),
                'date_fin'   => null,
                'actif'      => true,
                'statut'     => 'actif',
                'utilisateur'=> $id,
                'entreprise' => $entrepriseId,
            ]);

            // ── Historique ────────────────────────────────────────────────────
            $this->history(
                $id,
                'salaire_modifie',
                $request,
                $currentUser->id,
                $entrepriseId,
                $ancienMontant !== null
                    ? "Salaire modifié : {$ancienMontant} → {$montant} FCFA"
                    : "Salaire initial défini : {$montant} FCFA",
                $ancienMontant !== null ? (string) $ancienMontant : null,
                (string) $montant
            );

            DB::commit();

            // TODO NOTIFICATION: Envoyer une notification au directeur de l'entreprise.
            // Titre : "Salaire mis à jour"
            // Message : "Le salaire de l'employé [nom prénom] a été {modifié/défini} à {montant} FCFA."
            // Type : 'autre'
            // Destinataire : $entreprise->directeur

            // TODO NOTIFICATION: Envoyer une notification au module Finance
            // pour l'informer de la mise à jour de la masse salariale.
            // Message : "La masse salariale a été mise à jour suite à une modification de salaire."
            // Destinataires : tous les utilisateurs ayant le rôle manager_finances ou employe_finances

            return response()->json([
                'ok'      => true,
                'message' => 'Salaire mis à jour avec succès.',
                'salaire' => [
                    'id'            => $nouveauSalaireId,
                    'montant'       => $montant,
                    'ancienMontant' => $ancienMontant,
                    'dateDebut'     => now()->toDateString(),
                ],
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->rhErrorResponse($e, $request, __METHOD__, ['employe_id' => $id]);
        }
    }
}
