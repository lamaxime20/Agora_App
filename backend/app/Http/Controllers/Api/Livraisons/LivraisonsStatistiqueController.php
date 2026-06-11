<?php

namespace App\Http\Controllers\Api\Livraisons;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LivraisonsStatistiqueController extends LivraisonsBaseController
{
    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 16 — GET /api/livraisons/statistiques/general
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Vue générale : KPIs, répartition statuts, évolution mensuelle.
     *
     * Query params : date_debut, date_fin
     */
    public function general(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            $baseQuery = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId);

            if ($from) {
                $baseQuery->where('l.date_creation', '>=', $from);
            }
            if ($to) {
                $baseQuery->where('l.date_creation', '<=', $to);
            }

            $stats = (clone $baseQuery)
                ->selectRaw("
                    COUNT(l.id) as total,
                    COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) as livrees,
                    COUNT(CASE WHEN l.statut = 'echec'  THEN 1 END) as echecs,
                    COUNT(CASE WHEN l.statut = 'retour' THEN 1 END) as retours,
                    COALESCE(ROUND(
                        AVG(CASE WHEN l.statut = 'livree' AND l.date_lancement IS NOT NULL
                            THEN EXTRACT(EPOCH FROM (l.date_livraison_effective - l.date_lancement)) / 60
                            ELSE NULL END)
                    ), 0) as temps_moyen_min
                ")
                ->first();

            $total    = (int) ($stats->total ?? 0);
            $livrees  = (int) ($stats->livrees ?? 0);
            $echecs   = (int) ($stats->echecs ?? 0);
            $retours  = (int) ($stats->retours ?? 0);
            $successRate = $total > 0 ? round($livrees / $total * 100, 1) : 0.0;

            $livreursActifs = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId)
                ->where('l.statut', 'en_cours')
                ->distinct('l.livreur')
                ->count('l.livreur');

            $evolution = (clone $baseQuery)
                ->selectRaw("
                    TO_CHAR(DATE_TRUNC('month', l.date_creation), 'YYYY-MM') as mois,
                    COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) as livrees,
                    COUNT(CASE WHEN l.statut = 'echec'  THEN 1 END) as echecs,
                    COUNT(CASE WHEN l.statut = 'retour' THEN 1 END) as retours
                ")
                ->groupByRaw("DATE_TRUNC('month', l.date_creation)")
                ->orderByRaw("DATE_TRUNC('month', l.date_creation) ASC")
                ->get()
                ->map(fn($row) => [
                    'mois'    => $row->mois,
                    'livrees' => (int) $row->livrees,
                    'echecs'  => (int) $row->echecs,
                    'retours' => (int) $row->retours,
                ]);

            return response()->json([
                'kpis' => [
                    'total'             => $total,
                    'successRate'       => $successRate,
                    'failures'          => $echecs,
                    'returns'           => $retours,
                    'livreursActifs'    => $livreursActifs,
                    'tempsMoyenMinutes' => (int) ($stats->temps_moyen_min ?? 0),
                ],
                'repartitionStatuts' => [
                    'livrees' => $livrees,
                    'echecs'  => $echecs,
                    'retours' => $retours,
                ],
                'evolution' => $evolution,
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 17 — GET /api/livraisons/statistiques/livreurs
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Performance par livreur : livraisons, taux de réussite, temps moyen.
     *
     * Query params : date_debut, date_fin
     */
    public function livreurs(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            // Tous les livreurs actifs dans l'entreprise
            $allLivreurs = DB::table('appartenir_entreprise as ae')
                ->join('utilisateurs as u', 'u.id', '=', 'ae.utilisateur_id')
                ->join('roles_utilisateur as ru', 'ru.id', '=', 'ae.role_utilisateur_id')
                ->where('ae.entreprise_id', $entrepriseId)
                ->where('ae.statut', 'actif')
                ->where('ru.role', 'employe_livreur')
                ->select(['u.id', DB::raw("CONCAT(u.name, ' ', u.prename) as nom")])
                ->get();

            // Stats agrégées par livreur sur la période
            $statsQuery = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId);

            if ($from) {
                $statsQuery->where('l.date_creation', '>=', $from);
            }
            if ($to) {
                $statsQuery->where('l.date_creation', '<=', $to);
            }

            $statsParLivreur = $statsQuery
                ->selectRaw("
                    l.livreur as livreur_id,
                    COUNT(l.id) as livraisons,
                    COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) as livrees,
                    COUNT(CASE WHEN l.statut = 'echec'  THEN 1 END) as echecs,
                    COUNT(CASE WHEN l.statut = 'retour' THEN 1 END) as retours,
                    COALESCE(ROUND(
                        COUNT(CASE WHEN l.statut = 'livree' THEN 1 END)::numeric
                        / NULLIF(COUNT(l.id), 0)::numeric * 100, 1
                    ), 0) as success_rate,
                    COALESCE(ROUND(
                        AVG(CASE WHEN l.statut = 'livree' AND l.date_lancement IS NOT NULL
                            THEN EXTRACT(EPOCH FROM (l.date_livraison_effective - l.date_lancement)) / 60
                            ELSE NULL END)
                    ), 0) as temps_moyen_min
                ")
                ->groupBy('l.livreur')
                ->get()
                ->keyBy('livreur_id');

            $data = $allLivreurs->map(function ($l) use ($statsParLivreur) {
                $s = $statsParLivreur[$l->id] ?? null;
                return [
                    'id'           => $l->id,
                    'nom'          => $l->nom,
                    'livraisons'   => (int) ($s?->livraisons ?? 0),
                    'livrees'      => (int) ($s?->livrees ?? 0),
                    'echecs'       => (int) ($s?->echecs ?? 0),
                    'retours'      => (int) ($s?->retours ?? 0),
                    'successRate'  => (float) ($s?->success_rate ?? 0),
                    'tempsMoyenMin'=> (int) ($s?->temps_moyen_min ?? 0),
                ];
            })->sortByDesc('livraisons')->values();

            $avecLivraisons = $data->filter(fn($d) => $d['livraisons'] > 0);
            $avecLivrees    = $data->filter(fn($d) => $d['livrees'] > 0 && $d['tempsMoyenMin'] > 0);

            $meilleurLivreur = $avecLivraisons->isEmpty() ? null
                : $avecLivraisons->sortByDesc('successRate')->first()['nom'];
            $plusRapide = $avecLivrees->isEmpty() ? null
                : $avecLivrees->sortBy('tempsMoyenMin')->first()['nom'];
            $plusActif = $avecLivraisons->isEmpty() ? null
                : $avecLivraisons->first()['nom'];

            return response()->json([
                'data'           => $data,
                'meilleurLivreur'=> $meilleurLivreur,
                'plusRapide'     => $plusRapide,
                'plusActif'      => $plusActif,
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 18 — GET /api/livraisons/statistiques/activite
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Activité par jour, semaine, mois et jours actifs.
     *
     * Query params : date_debut (défaut J-30), date_fin
     */
    public function activite(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            $dateDebut = $request->query('date_debut');
            $dateFin   = $request->query('date_fin');

            $from = $dateDebut ? Carbon::parse($dateDebut)->startOfDay() : Carbon::today()->subDays(30)->startOfDay();
            $to   = $dateFin   ? Carbon::parse($dateFin)->endOfDay()     : Carbon::today()->endOfDay();

            $baseQuery = fn() => DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId)
                ->whereBetween('l.date_creation', [$from, $to]);

            // parJour : 7 derniers jours (J-6 à aujourd'hui)
            $sevenDaysAgo = Carbon::today()->subDays(6)->startOfDay();
            $today        = Carbon::today()->endOfDay();

            $dailyRaw = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId)
                ->whereBetween('l.date_creation', [$sevenDaysAgo, $today])
                ->selectRaw("
                    DATE_TRUNC('day', l.date_creation) as jour_date,
                    COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) as livrees,
                    COUNT(CASE WHEN l.statut = 'echec'  THEN 1 END) as echecs,
                    COUNT(CASE WHEN l.statut = 'retour' THEN 1 END) as retours
                ")
                ->groupByRaw("DATE_TRUNC('day', l.date_creation)")
                ->get()
                ->keyBy(fn($row) => Carbon::parse($row->jour_date)->format('Y-m-d'));

            $joursFr = ['Sun' => 'Dim', 'Mon' => 'Lun', 'Tue' => 'Mar', 'Wed' => 'Mer', 'Thu' => 'Jeu', 'Fri' => 'Ven', 'Sat' => 'Sam'];

            $parJour = [];
            for ($i = 6; $i >= 0; $i--) {
                $day  = Carbon::today()->subDays($i);
                $key  = $day->format('Y-m-d');
                $row  = $dailyRaw[$key] ?? null;
                $abbr = $joursFr[$day->format('D')] ?? $day->format('D');
                $parJour[] = [
                    'jour'    => $abbr . ' ' . $day->format('d'),
                    'livrees' => (int) ($row?->livrees ?? 0),
                    'echecs'  => (int) ($row?->echecs ?? 0),
                    'retours' => (int) ($row?->retours ?? 0),
                ];
            }

            // parSemaine : grouper par semaine ISO sur la période
            $parSemaine = (clone $baseQuery())
                ->selectRaw("
                    CONCAT('S', TO_CHAR(l.date_creation, 'IW')) as semaine,
                    EXTRACT(ISOYEAR FROM l.date_creation)::int as iso_year,
                    TO_CHAR(l.date_creation, 'IW') as iso_week,
                    COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) as livrees,
                    COUNT(CASE WHEN l.statut = 'echec'  THEN 1 END) as echecs,
                    COUNT(CASE WHEN l.statut = 'retour' THEN 1 END) as retours
                ")
                ->groupByRaw("EXTRACT(ISOYEAR FROM l.date_creation), TO_CHAR(l.date_creation, 'IW')")
                ->orderByRaw("EXTRACT(ISOYEAR FROM l.date_creation) ASC, TO_CHAR(l.date_creation, 'IW') ASC")
                ->get()
                ->map(fn($row) => [
                    'semaine' => $row->semaine,
                    'livrees' => (int) $row->livrees,
                    'echecs'  => (int) $row->echecs,
                    'retours' => (int) $row->retours,
                ]);

            // parMois : grouper par mois sur la période
            $parMois = (clone $baseQuery())
                ->selectRaw("
                    TO_CHAR(DATE_TRUNC('month', l.date_creation), 'YYYY-MM') as mois,
                    COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) as livrees
                ")
                ->groupByRaw("DATE_TRUNC('month', l.date_creation)")
                ->orderByRaw("DATE_TRUNC('month', l.date_creation) ASC")
                ->get()
                ->map(fn($row) => [
                    'mois'    => $row->mois,
                    'livrees' => (int) $row->livrees,
                ]);

            // joursActifs : 8 derniers jours (J-7 à aujourd'hui), toutes livraisons
            $eightDaysAgo = Carbon::today()->subDays(7)->startOfDay();

            $joursActifsRaw = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId)
                ->whereBetween('l.date_creation', [$eightDaysAgo, $today])
                ->selectRaw("DATE_TRUNC('day', l.date_creation) as jour_date, COUNT(l.id) as count")
                ->groupByRaw("DATE_TRUNC('day', l.date_creation)")
                ->get()
                ->keyBy(fn($row) => Carbon::parse($row->jour_date)->format('Y-m-d'));

            $joursActifs = [];
            for ($i = 7; $i >= 0; $i--) {
                $day = Carbon::today()->subDays($i);
                $key = $day->format('Y-m-d');
                $joursActifs[] = [
                    'date'  => $key,
                    'count' => (int) ($joursActifsRaw[$key]?->count ?? 0),
                ];
            }

            return response()->json([
                'parJour'     => $parJour,
                'parSemaine'  => $parSemaine,
                'parMois'     => $parMois,
                'joursActifs' => $joursActifs,
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 19 — GET /api/livraisons/statistiques/echecs
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Analyse des motifs d'échec : KPIs et top 5 motifs.
     *
     * Query params : date_debut, date_fin
     */
    public function echecs(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            $baseQuery = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId);

            if ($from) {
                $baseQuery->where('l.date_creation', '>=', $from);
            }
            if ($to) {
                $baseQuery->where('l.date_creation', '<=', $to);
            }

            $totalLivraisons = (clone $baseQuery)->count();

            $echecsQuery = (clone $baseQuery)->where('l.statut', 'echec');

            $total = (clone $echecsQuery)->count();
            $taux  = $totalLivraisons > 0 ? round($total / $totalLivraisons * 100, 2) : 0.0;

            $clientsAbsents    = (clone $echecsQuery)->whereRaw("l.motif_echec ILIKE '%absent%'")->count();
            $adresseIncorrecte = (clone $echecsQuery)->whereRaw("l.motif_echec ILIKE '%adresse%'")->count();

            // Top 5 motifs d'échec
            $motifs = (clone $echecsQuery)
                ->whereNotNull('l.motif_echec')
                ->selectRaw("l.motif_echec as motif, COUNT(l.id) as count")
                ->groupBy('l.motif_echec')
                ->orderByRaw("COUNT(l.id) DESC")
                ->limit(5)
                ->get()
                ->map(fn($row) => [
                    'motif'       => $row->motif,
                    'count'       => (int) $row->count,
                    'pourcentage' => $total > 0 ? (int) round($row->count / $total * 100) : 0,
                ]);

            return response()->json([
                'kpis' => [
                    'total'             => $total,
                    'taux'              => $taux,
                    'clientsAbsents'    => $clientsAbsents,
                    'adresseIncorrecte' => $adresseIncorrecte,
                ],
                'data' => $motifs,
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 20 — GET /api/livraisons/statistiques/retours
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Analyse des motifs de retour : KPIs et top 5 motifs.
     *
     * Query params : date_debut, date_fin
     */
    public function retours(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            $baseQuery = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId)
                ->where('l.statut', 'retour');

            if ($from) {
                $baseQuery->where('l.date_creation', '>=', $from);
            }
            if ($to) {
                $baseQuery->where('l.date_creation', '<=', $to);
            }

            $total = (clone $baseQuery)->count();

            $refusClient = (clone $baseQuery)
                ->where(function ($q) {
                    $q->whereRaw("l.motif_retour ILIKE '%refus%'")
                      ->orWhereRaw("l.motif_retour ILIKE '%refusé%'");
                })
                ->count();

            $produitNonConforme = (clone $baseQuery)
                ->where(function ($q) {
                    $q->whereRaw("l.motif_retour ILIKE '%conforme%'")
                      ->orWhereRaw("l.motif_retour ILIKE '%défaut%'")
                      ->orWhereRaw("l.motif_retour ILIKE '%non conforme%'");
                })
                ->count();

            $motifs = (clone $baseQuery)
                ->whereNotNull('l.motif_retour')
                ->selectRaw("l.motif_retour as motif, COUNT(l.id) as count")
                ->groupBy('l.motif_retour')
                ->orderByRaw("COUNT(l.id) DESC")
                ->limit(5)
                ->get()
                ->map(fn($row) => [
                    'motif'       => $row->motif,
                    'count'       => (int) $row->count,
                    'pourcentage' => $total > 0 ? (int) round($row->count / $total * 100) : 0,
                ]);

            return response()->json([
                'kpis' => [
                    'total'              => $total,
                    'refusClient'        => $refusClient,
                    'produitNonConforme' => $produitNonConforme,
                ],
                'data' => $motifs,
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 21 — GET /api/livraisons/statistiques/geographie
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Volume de livraisons par zone géographique (ville extraite de adresse_livraison).
     *
     * Query params : date_debut, date_fin
     */
    public function geographie(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            $query = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->where('c.entreprise', $entrepriseId)
                ->whereNotNull('c.adresse_livraison')
                ->whereRaw("TRIM(c.adresse_livraison) != ''");

            if ($from) {
                $query->where('l.date_creation', '>=', $from);
            }
            if ($to) {
                $query->where('l.date_creation', '<=', $to);
            }

            // Extraction de la ville : premier segment avant la première virgule
            $data = $query
                ->selectRaw("
                    TRIM(SPLIT_PART(c.adresse_livraison, ',', 1)) as ville,
                    COUNT(l.id) as livraisons,
                    COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) as succes,
                    COUNT(CASE WHEN l.statut = 'echec'  THEN 1 END) as echecs,
                    COUNT(CASE WHEN l.statut = 'retour' THEN 1 END) as retours
                ")
                ->groupByRaw("TRIM(SPLIT_PART(c.adresse_livraison, ',', 1))")
                ->orderByRaw("COUNT(l.id) DESC")
                ->get()
                ->map(fn($row) => [
                    'ville'     => $row->ville,
                    'livraisons'=> (int) $row->livraisons,
                    'succes'    => (int) $row->succes,
                    'echecs'    => (int) $row->echecs,
                    'retours'   => (int) $row->retours,
                ]);

            $villeActive    = $data->isEmpty() ? null : $data->first()['ville'];
            $villeDifficile = $data->isEmpty() ? null : $data->sortByDesc('echecs')->first()['ville'];
            $villeRentable  = $data->isEmpty() ? null : $data->sortByDesc('succes')->first()['ville'];

            return response()->json([
                'kpis' => [
                    'villeActive'    => $villeActive,
                    'villeDifficile' => $villeDifficile,
                    'villeRentable'  => $villeRentable,
                ],
                'data' => $data->values(),
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 22 — GET /api/livraisons/statistiques/clients
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Top clients par volume de livraisons reçues.
     *
     * Query params : date_debut, date_fin, limit (défaut 10)
     */
    public function clients(Request $request): JsonResponse
    {
        try {
            $entreprise   = $this->currentEntreprise($request);
            $entrepriseId = $entreprise->id;

            [$from, $to] = $this->daterange(
                $request->query('date_debut'),
                $request->query('date_fin')
            );

            $limit = max(1, min(100, (int) $request->query('limit', 10)));

            $query = DB::table('livraisons as l')
                ->join('commandes as c', 'c.id', '=', 'l.commande')
                ->join('clients as cl', 'cl.id', '=', 'c.client')
                ->where('c.entreprise', $entrepriseId);

            if ($from) {
                $query->where('l.date_creation', '>=', $from);
            }
            if ($to) {
                $query->where('l.date_creation', '<=', $to);
            }

            $data = $query
                ->selectRaw("
                    cl.id as client_id,
                    CONCAT(cl.nom, ' ', COALESCE(cl.prenom, '')) as client,
                    COUNT(DISTINCT c.id) as commandes,
                    COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) as livraisons,
                    COUNT(CASE WHEN l.statut = 'retour' THEN 1 END) as retours,
                    COUNT(CASE WHEN l.statut = 'echec'  THEN 1 END) as echecs
                ")
                ->groupBy('cl.id', DB::raw("CONCAT(cl.nom, ' ', COALESCE(cl.prenom, ''))"))
                ->orderByRaw("COUNT(CASE WHEN l.statut = 'livree' THEN 1 END) DESC")
                ->limit($limit)
                ->get()
                ->map(fn($row) => [
                    'client'    => $row->client,
                    'commandes' => (int) $row->commandes,
                    'livraisons'=> (int) $row->livraisons,
                    'retours'   => (int) $row->retours,
                    'echecs'    => (int) $row->echecs,
                ]);

            $clientPlusLivre  = $data->isEmpty() ? null : $data->first()['client'];
            $clientPlusRetours= $data->isEmpty() ? null : collect($data)->sortByDesc('retours')->first()['client'];
            $clientPlusFidele = $data->isEmpty() ? null : collect($data)->sortByDesc('commandes')->first()['client'];

            return response()->json([
                'kpis' => [
                    'clientPlusLivre'  => $clientPlusLivre,
                    'clientPlusRetours'=> $clientPlusRetours,
                    'clientPlusFidele' => $clientPlusFidele,
                ],
                'data' => $data->values(),
            ], 200);
        } catch (\Throwable $e) {
            return $this->livraisonsErrorResponse($e, $request, __METHOD__);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ROUTE 23 — GET /api/livraisons/statistiques/export
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Export du rapport statistiques en PDF, CSV ou DOCX.
     *
     * TODO: Implémenter la génération de fichier.
     * Exécuter les mêmes calculs que la section correspondante (routes 16-22)
     * sans pagination, selon le paramètre section (general|livreurs|activite|echecs|retours|geographie|clients).
     */
    public function export(Request $request): JsonResponse
    {
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_IMPLEMENTED',
            'message' => 'Export non encore implémenté.',
        ], 501);
    }
}
