import { apiFetch } from "./api.js";
import { readCache, writeCache } from "./stockCache.js";

const CACHE_KEY_DASHBOARD = "fin-dashboard";

/**
 * Dashboard principal.
 * Le backend retourne {main: {...kpis}, tresorerie: [...], activites: [...]}.
 * On enveloppe dans {main: {data}, tresorerie: {data}, activites: {data}}
 * pour conserver la forme attendue par les sous-composants finances.
 */
export async function fetchDashboard() {
    const stale = readCache(CACHE_KEY_DASHBOARD);
    let result;
    try {
        const raw = await apiFetch("finances/dashboard");
        result = {
            main:       { data: raw.main       ?? {} },
            tresorerie: { data: raw.tresorerie  ?? [] },
            activites:  { data: raw.activites   ?? [] },
        };
        writeCache(CACHE_KEY_DASHBOARD, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le tableau de bord finances.");
    }
    return result;
}

export async function fetchCommandes(page = 1) {
    const res = await apiFetch(`finances/commandes?page=${page}&per_page=20`);
    return res;
}

export async function fetchCommandeDetail(id) {
    return apiFetch(`finances/commandes/${id}`);
}

export async function fetchPaiements(page = 1) {
    return apiFetch(`finances/paiements?page=${page}&per_page=20`);
}

export async function creerPaiement(payload) {
    return apiFetch("finances/paiements", { method: "POST", body: payload });
}
