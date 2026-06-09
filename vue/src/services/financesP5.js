import { apiFetch } from "./api.js";

// ─── SALAIRES ───────────────────────────────────────────────────────────────

export async function fetchSalaires(page = 1, filtreStatut = "tous") {
    const statut = filtreStatut !== "tous" ? `&statut=${filtreStatut}` : "";
    return apiFetch(`finances/salaires?page=${page}&per_page=20${statut}`);
}

export async function fetchSalarieDetail(id) {
    return apiFetch(`finances/salaires/${id}`);
}

export async function fetchSalairePaiements(employeeId, page = 1) {
    return apiFetch(`finances/salaires/${employeeId}/paiements?page=${page}&per_page=20`);
}

// ─── JOURNAL FINANCIER ──────────────────────────────────────────────────────

export async function fetchJournalFinancier(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, per_page: 20 });
    if (filters.recherche)                params.set("recherche", filters.recherche);
    if (filters.type && filters.type !== "tous")     params.set("type", filters.type);
    if (filters.sens && filters.sens !== "tous")     params.set("sens", filters.sens);
    if (filters.dateDebut)                params.set("date_debut", filters.dateDebut);
    if (filters.dateFin)                  params.set("date_fin", filters.dateFin);
    return apiFetch(`finances/journal?${params.toString()}`);
}

export async function fetchMouvementDetail(id) {
    return apiFetch(`finances/journal/${id}`);
}

// ─── STATISTIQUES ───────────────────────────────────────────────────────────

export async function fetchStatsVueGenerale() {
    const res = await apiFetch("finances/statistiques/vue-generale");
    return res.data ?? res;
}

export async function fetchStatsTresorerie() {
    const res = await apiFetch("finances/statistiques/tresorerie");
    return res.data ?? res;
}

export async function fetchStatsAutres() {
    const res = await apiFetch("finances/statistiques/autres");
    return res.data ?? res;
}
