<?php

namespace App\Http\Controllers\Api\RH;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RhEmployeController extends RhBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 2 — GET /api/rh/employes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Liste complète des employés de l'entreprise (hors directeur).
     * La pagination et le filtrage sont gérés côté frontend.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $directeurId  = $entreprise->directeur;

            $employees = DB::select("
                SELECT DISTINCT ON (u.id)
                    u.id,
                    u.name                 AS nom,
                    u.prename              AS prenom,
                    u.email,
                    r.role,
                    ae.date_enregistrement,
                    ae.statut              AS ae_statut,
                    sal.montant            AS salaire
                FROM utilisateurs u
                JOIN appartenir_entreprise ae
                    ON ae.utilisateur_id = u.id
                JOIN roles_utilisateur r
                    ON r.id = ae.role_utilisateur_id
                LEFT JOIN LATERAL (
                    SELECT montant
                    FROM   salaires s
                    WHERE  s.utilisateur = u.id
                    AND    s.entreprise  = ?
                    AND    s.statut      = 'actif'
                    AND    s.actif       = true
                    ORDER  BY s.date_debut DESC NULLS LAST
                    LIMIT  1
                ) sal ON true
                WHERE ae.entreprise_id  = ?
                AND   ae.statut         = 'actif'
                AND   ae.utilisateur_id != ?
                AND   r.role            != 'directeur'
                ORDER BY u.id, ae.date_enregistrement DESC
            ", [$entrepriseId, $entrepriseId, $directeurId]);

            $formatted = collect($employees)->map(fn($r) => [
                'id'        => $r->id,
                'nom'       => $r->nom,
                'prenom'    => $r->prenom,
                'email'     => $r->email,
                'role'      => $r->role,
                'salaire'   => $r->salaire !== null ? (float) $r->salaire : null,
                'dateAjout' => $r->date_enregistrement ? substr($r->date_enregistrement, 0, 10) : null,
                'statut'    => $r->ae_statut,
            ])->values();

            return response()->json([
                'employees' => $formatted,
                'total'     => $formatted->count(),
            ], 200);
        } catch (\Throwable $e) {
            return $this->rhErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 3 — POST /api/rh/employes
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Ajouter un utilisateur à l'entreprise avec un rôle donné.
     *
     * Body : { email: string, role: string }
     *
     * Logique :
     *  - Si l'email n'existe pas → création automatique (password : 12345678)
     *  - Si l'email existe       → récupération de l'id utilisateur
     *  - Association dans appartenir_entreprise avec le rôle choisi
     *  - Le rôle directeur est exclu
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $currentUser  = $this->currentUser($request);

            // ── Validation ────────────────────────────────────────────────────
            $email    = trim((string) $request->input('email', ''));
            $roleSlug = trim((string) $request->input('role', ''));

            $errors = [];
            if ($email === '') {
                $errors['email'] = "L'email est obligatoire.";
            } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = "Format d'email invalide.";
            }
            if ($roleSlug === '') {
                $errors['role'] = "Le rôle est obligatoire.";
            } elseif ($roleSlug === 'directeur') {
                $errors['role'] = "Le rôle directeur ne peut pas être assigné via ce formulaire.";
            }

            if (!empty($errors)) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => $errors,
                ], 422);
            }

            // ── Vérification du rôle ──────────────────────────────────────────
            $roleRecord = DB::table('roles_utilisateur')
                ->where('role', $roleSlug)
                ->where('role', '!=', 'directeur')
                ->first(['id', 'role']);

            if (!$roleRecord) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'ROLE_NOT_FOUND',
                    'message' => "Rôle introuvable : {$roleSlug}.",
                ], 404);
            }

            DB::beginTransaction();

            // ── Recherche ou création de l'utilisateur ────────────────────────
            $existingUser = DB::table('utilisateurs')
                ->where('email', $email)
                ->first(['id', 'name', 'prename', 'email', 'statut']);

            if ($existingUser) {
                $userId     = $existingUser->id;
                $userCreated = false;
            } else {
                // Création automatique : nom/prénom déduits de la partie locale de l'email
                $localPart = explode('@', $email)[0];
                $parts     = preg_split('/[._-]/', $localPart, 2);
                $nom       = ucfirst(strtolower($parts[0] ?? $localPart));
                $prenom    = ucfirst(strtolower($parts[1] ?? $nom));

                $userId = (string) Str::uuid();
                DB::table('utilisateurs')->insert([
                    'id'            => $userId,
                    'email'         => $email,
                    'password_hash' => Hash::make('12345678'),
                    'name'          => $nom,
                    'prename'       => $prenom,
                    'statut'        => 'actif',
                    'created_at'    => now(),
                ]);
                $userCreated = true;
            }

            // ── Vérification : déjà associé avec ce rôle ? ───────────────────
            $alreadyExists = DB::table('appartenir_entreprise')
                ->where('utilisateur_id', $userId)
                ->where('entreprise_id', $entrepriseId)
                ->where('role_utilisateur_id', $roleRecord->id)
                ->exists();

            if ($alreadyExists) {
                DB::rollBack();
                return response()->json([
                    'ok'      => false,
                    'code'    => 'ALREADY_MEMBER',
                    'message' => "Cet utilisateur est déjà associé à l'entreprise avec ce rôle.",
                ], 409);
            }

            // ── Insertion dans appartenir_entreprise ──────────────────────────
            DB::table('appartenir_entreprise')->insert([
                'utilisateur_id'     => $userId,
                'entreprise_id'      => $entrepriseId,
                'role_utilisateur_id' => $roleRecord->id,
                'date_enregistrement' => now(),
                'statut'             => 'actif',
            ]);

            // ── Historique ────────────────────────────────────────────────────
            $this->history(
                $userId,
                'employe_ajoute',
                $request,
                $currentUser->id,
                $entrepriseId,
                "Ajouté avec le rôle : {$roleSlug}",
                null,
                $roleSlug
            );

            DB::commit();

            // TODO NOTIFICATION: Envoyer une notification au directeur de l'entreprise.
            // Titre : "Nouvel employé ajouté"
            // Message : "L'utilisateur {email} a été ajouté à l'entreprise avec le rôle {roleLabel}."
            // Type : 'autre'
            // Destinataire : $entreprise->directeur

            return response()->json([
                'ok'      => true,
                'message' => 'Employé ajouté avec succès.',
                'created' => $userCreated,
                'employee' => [
                    'id'    => $userId,
                    'email' => $email,
                    'role'  => $roleSlug,
                ],
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->rhErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 4 — GET /api/rh/employes/{id}
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Détail d'un employé : informations, historique salarial, historique des rôles.
     *
     * Path param : id = utilisateur_id (UUID)
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;
            $directeurId  = $entreprise->directeur;

            // ── Données de base de l'employé ──────────────────────────────────
            $row = DB::selectOne("
                SELECT DISTINCT ON (u.id)
                    u.id,
                    u.name                 AS nom,
                    u.prename              AS prenom,
                    u.email,
                    r.role,
                    ae.date_enregistrement,
                    ae.statut              AS ae_statut,
                    sal.montant            AS salaire
                FROM utilisateurs u
                JOIN appartenir_entreprise ae
                    ON ae.utilisateur_id = u.id
                JOIN roles_utilisateur r
                    ON r.id = ae.role_utilisateur_id
                LEFT JOIN LATERAL (
                    SELECT montant
                    FROM   salaires s
                    WHERE  s.utilisateur = u.id
                    AND    s.entreprise  = ?
                    AND    s.statut      = 'actif'
                    AND    s.actif       = true
                    ORDER  BY s.date_debut DESC NULLS LAST
                    LIMIT  1
                ) sal ON true
                WHERE  u.id             = ?
                AND    ae.entreprise_id = ?
                AND    ae.statut        = 'actif'
                AND    u.id            != ?
                AND    r.role          != 'directeur'
                ORDER  BY u.id, ae.date_enregistrement DESC
            ", [$entrepriseId, $id, $entrepriseId, $directeurId]);

            if (!$row) {
                return response()->json([
                    'ok'      => false,
                    'code'    => 'NOT_FOUND',
                    'message' => 'Employé introuvable.',
                ], 404);
            }

            // ── Historique salarial ───────────────────────────────────────────
            $salaires = DB::table('salaires')
                ->where('utilisateur', $id)
                ->where('entreprise', $entrepriseId)
                ->where('actif', true)
                ->orderBy('date_debut', 'asc')
                ->get(['id', 'montant', 'date_debut', 'date_fin', 'statut']);

            $salaryHistory = [];
            foreach ($salaires as $i => $sal) {
                $salaryHistory[] = [
                    'date'          => $sal->date_debut ?? substr($row->date_enregistrement, 0, 10),
                    'ancienMontant' => $i > 0 ? (float) $salaires[$i - 1]->montant : null,
                    'nouveauMontant'=> (float) $sal->montant,
                    'motif'         => null,
                ];
            }

            // ── Historique des rôles (via historiques + entrée initiale) ──────
            $roleHistory = [];

            // Entrée initiale : date de la première association
            $premierRole = DB::table('appartenir_entreprise as ae')
                ->join('roles_utilisateur as r', 'r.id', '=', 'ae.role_utilisateur_id')
                ->where('ae.utilisateur_id', $id)
                ->where('ae.entreprise_id', $entrepriseId)
                ->where('r.role', '!=', 'directeur')
                ->orderBy('ae.date_enregistrement', 'asc')
                ->first(['r.role', 'ae.date_enregistrement']);

            if ($premierRole) {
                $roleHistory[] = [
                    'date'       => substr($premierRole->date_enregistrement, 0, 10),
                    'ancienRole' => null,
                    'nouveauRole'=> $premierRole->role,
                    'motif'      => 'Ajout initial',
                ];
            }

            // Changements enregistrés dans la table historiques
            $changementsRole = DB::table('historiques')
                ->where('module', 'rh')
                ->where('table_concernee', 'appartenir_entreprise')
                ->where('id_element', $id)
                ->where('entreprise', $entrepriseId)
                ->where('action', 'role_modifie')
                ->orderBy('date_action', 'asc')
                ->get(['ancienne_valeur', 'nouvelle_valeur', 'date_action', 'details_action']);

            foreach ($changementsRole as $h) {
                $roleHistory[] = [
                    'date'       => substr($h->date_action, 0, 10),
                    'ancienRole' => $h->ancienne_valeur,
                    'nouveauRole'=> $h->nouvelle_valeur,
                    'motif'      => $h->details_action,
                ];
            }

            return response()->json([
                'employee' => [
                    'id'         => $row->id,
                    'nom'        => $row->nom,
                    'prenom'     => $row->prenom,
                    'email'      => $row->email,
                    'role'       => $row->role,
                    'salaire'    => $row->salaire !== null ? (float) $row->salaire : null,
                    'dateAjout'  => $row->date_enregistrement ? substr($row->date_enregistrement, 0, 10) : null,
                    'statut'     => $row->ae_statut,
                    'entreprise' => $entreprise->nom,
                ],
                'salaryHistory' => $salaryHistory,
                'roleHistory'   => $roleHistory,
            ], 200);
        } catch (\Throwable $e) {
            return $this->rhErrorResponse($e, $request, __METHOD__, ['employe_id' => $id]);
        }
    }
}
