import { apiFetch } from "./api.js";
import { readCache, writeCache } from "./financesCache.js";

// ─── SALAIRES ───────────────────────────────────────────────────────────────

export async function fetchSalaires(page = 1, filtreStatut = "tous") {
    const cacheKey = `salaires_${page}_${filtreStatut}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        const statut = filtreStatut !== "tous" ? `&statut=${filtreStatut}` : "";
        result = await apiFetch(`finances/salaires?page=${page}&per_page=20${statut}`);
        writeCache(cacheKey, result);
    } catch {
        // The component will handle displaying stale data if available.
        throw new Error("Impossible de charger les salaires.");
    }
    return result;
}

export async function fetchSalarieDetail(id) {
    const cacheKey = `salarie_${id}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/salaires/${id}`);
        writeCache(cacheKey, result);
    } catch {
        // The component will handle displaying stale data if available.
        throw new Error("Impossible de charger le détail du salarié.");
    }
    return result;
}

export async function fetchSalairePaiements(employeeId, page = 1) {
    const cacheKey = `salaire_paiements_${employeeId}_${page}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/salaires/${employeeId}/paiements?page=${page}&per_page=20`);
        writeCache(cacheKey, result);
    } catch {
        // The component will handle displaying stale data if available.
        throw new Error("Impossible de charger les paiements de salaire.");
    }
    return result;
}

// ─── JOURNAL FINANCIER ──────────────────────────────────────────────────────

export async function fetchJournalFinancier(page = 1, filters = {}) {
    const cacheKey = `journal_financier_${page}_${JSON.stringify(filters)}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        const params = new URLSearchParams({ page, per_page: 20 });
        if (filters.recherche)                params.set("recherche", filters.recherche);
        if (filters.type && filters.type !== "tous")     params.set("type", filters.type);
        if (filters.sens && filters.sens !== "tous")     params.set("sens", filters.sens);
        if (filters.dateDebut)                params.set("date_debut", filters.dateDebut);
        if (filters.dateFin)                  params.set("date_fin", filters.dateFin);
        result = await apiFetch(`finances/journal?${params.toString()}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le journal financier.");
    }
    return result;
}

export async function fetchMouvementDetail(id) {
    const cacheKey = `mouvement_${id}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/journal/${id}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le détail du mouvement.");
    }
    return result;
}

// ─── STATISTIQUES ───────────────────────────────────────────────────────────

export async function fetchStatsVueGenerale() {
    const cacheKey = "stats_vue_generale";
    const stale = readCache(cacheKey);
    let result;
    try {
        const res = await apiFetch("finances/statistiques/vue-generale");
        result = res.data ?? res;
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les statistiques générales.");
    }
    return result;
}

export async function fetchStatsTresorerie() {
    const cacheKey = "stats_tresorerie";
    const stale = readCache(cacheKey);
    let result;
    try {
        const res = await apiFetch("finances/statistiques/tresorerie");
        result = res.data ?? res;
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les statistiques de trésorerie.");
    }
    return result;
}

export async function fetchStatsAutres() {
    const cacheKey = "stats_autres";
    const stale = readCache(cacheKey);
    let result;
    try {
        const res = await apiFetch("finances/statistiques/autres");
        result = res.data ?? res;
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les autres statistiques.");
    }
    return result;
}
