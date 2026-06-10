import { apiFetch } from "./api.js";
import { readCache, writeCache } from "./financesCache.js";

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
    const cacheKey = `commandes_${page}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/commandes?page=${page}&per_page=20`);
        writeCache(cacheKey, result.data ?? []);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les commandes.");
    }
    return result;
}

export async function fetchCommandeDetail(id) {
    const cacheKey = `commande_detail_${id}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/commandes/${id}`);
        console.log("finances dashboard", result);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le détail de la commande.");
    }
    return result;
}

export async function fetchPaiements(page = 1) {
    const cacheKey = `paiements_${page}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/paiements?page=${page}&per_page=20`);
        writeCache(cacheKey, result.paiements ?? []);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les paiements.");
    }
    return result;
}

export async function creerPaiement(payload, id) {
    const MODES = ["virement bancaire", "carte bancaire", "chèque", "espèces"];
    let mode_payement;
    if(payload.mode === "virement bancaire") {
        mode_payement = "virement";
    } else if(payload.mode === "carte bancaire") {
        mode_payement = "carte_bancaire";
    } else if(payload.mode === "chèque") {
        mode_payement = "cheque";
    } else if(payload.mode === "espèces") {
        mode_payement = "cash";
    } else {
        mode_payement = "cash";
    }

    const body = {
        montant: payload.montant,
        mode_payement: mode_payement,
        reference_transaction: payload.reference,
    }
    console.log(body);
    return apiFetch(`finances/commandes/${id}/paiements`, { 
        method: "POST", 
        body: body
    });
}

export async function modifierMontantMinimum(id, montant_minimum_validation) {
    const body = { montant_minimum_validation };
    return apiFetch(`finances/commandes/${id}/montant-minimum`, { method: "PATCH", body: body });
}
