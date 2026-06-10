import { apiFetch } from "./api.js";
import { readCache, writeCache } from "./financesCache.js";

// ─── REMBOURSEMENTS ─────────────────────────────────────────────────────────────

export async function fetchRemboursements(page = 1) {
    const cacheKey = `remboursements_${page}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/remboursements?page=${page}&per_page=20`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les remboursements.");
    }
    return result;
}

export async function fetchCommandesRemboursables() {
    const cacheKey = "commandes-remboursables";
    const stale = readCache(cacheKey);
    let result;
    try {
        const res = await apiFetch("finances/commandes-remboursables");
        result = res.data ?? res.commandes ?? res ?? [];
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les commandes remboursables.");
    }
    return result;
}

export async function creerRemboursement(payload) {
    return apiFetch("finances/remboursements", { method: "POST", body: payload });
}

// ─── DÉPENSES ───────────────────────────────────────────────────────────────────

export async function fetchDepenses(page = 1) {
    const cacheKey = `depenses_${page}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/depenses?page=${page}&per_page=20`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les dépenses.");
    }
    return result;
}

export async function creerDepense(payload) {
    const body = {
        montant: payload.montant,
        date_depense: payload.date,
        raison: payload.description,
    }
    return apiFetch("finances/depenses", { method: "POST", body: body });
}

// ─── ENTRÉES ────────────────────────────────────────────────────────────────────

export async function fetchEntrees(page = 1) {
    const cacheKey = `entrees_${page}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/entrees?page=${page}&per_page=20`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les entrées.");
    }
    return result;
}

export async function creerEntree(payload) {
    console.log("entree :", payload);
    const body = {
        montant: payload.montant,
        date_entree: payload.date,
        raison: payload.description,
    }
    return apiFetch("finances/entrees", { method: "POST", body: body });
}
