import { apiFetch } from "./api.js";
import { readCache, writeCache } from "./financesCache.js";

// ─── ABONNEMENTS ────────────────────────────────────────────────────────────────

export async function fetchAbonnements(page = 1, filtreStatut = "tous") {
    const cacheKey = `abonnements_${page}_${filtreStatut}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        const statut = `&statut=${filtreStatut}`;
        result = await apiFetch(`finances/abonnements?page=${page}&per_page=20${statut}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les abonnements.");
    }
    return result;
}

export async function fetchAbonnementDetail(id) {
    const cacheKey = `abonnement_${id}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/abonnements/${id}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le détail de l'abonnement.");
    }
    return result;
}

export async function creerAbonnement(payload) {
    const body = {
        service_paye: payload.nomService,
        fournisseur: payload.fournisseur,
        montant_mensuel: payload.montantMensuel,
        date_abonnement: payload.dateDebut
    }
    return apiFetch("finances/abonnements", { method: "POST", body: body });
}

export async function suspendreAbonnement(id, payload) {
    const body = {
        couper_mois_courant: payload.payerMoisCourant
    }
    return apiFetch(`finances/abonnements/${id}/resilier`, { method: "POST", body: body });
}

export async function reactiverAbonnement(id, payload) {
    const body = {
        payer_mois_courant: payload.payerMoisCourant
    }
    return apiFetch(`finances/abonnements/${id}/reactiver`, { method: "POST", body: body });
}

// ─── RÉAPPROVISIONNEMENTS ───────────────────────────────────────────────────────

export async function fetchReapprosEnAttente(page = 1) {
    const cacheKey = `reappros_en_attente_${page}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/reapprovisionnements?page=${page}&per_page=20&statut=en_attente`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les réapprovisionnements en attente.");
    }
    return result;
}

export async function fetchReapprosHistorique(page = 1) {
    const cacheKey = `reappros_historique_${page}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`finances/reapprovisionnements/historique?page=${page}&per_page=20`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger l'historique des réapprovisionnements.");
    }
    return result;
}

export async function validerReappro(id, payload) {
    return apiFetch(`finances/reapprovisionnements/${id}/valider`, { method: "POST", body: payload });
}

export async function refuserReappro(id, payload) {
    return apiFetch(`finances/reapprovisionnements/${id}/refuser`, { method: "POST", body: payload });
}
