import { apiFetch } from "./api.js";

// ─── ABONNEMENTS ────────────────────────────────────────────────────────────────

export async function fetchAbonnements(page = 1, filtreStatut = "tous") {
    const statut = filtreStatut !== "tous" ? `&statut=${filtreStatut}` : "";
    return apiFetch(`finances/abonnements?page=${page}&per_page=20${statut}`);
}

export async function fetchAbonnementDetail(id) {
    return apiFetch(`finances/abonnements/${id}`);
}

export async function creerAbonnement(payload) {
    return apiFetch("finances/abonnements", { method: "POST", body: payload });
}

export async function suspendreAbonnement(id, payload) {
    return apiFetch(`finances/abonnements/${id}/suspendre`, { method: "POST", body: payload });
}

export async function reactiverAbonnement(id, payload) {
    return apiFetch(`finances/abonnements/${id}/reactiver`, { method: "POST", body: payload });
}

// ─── RÉAPPROVISIONNEMENTS ───────────────────────────────────────────────────────

export async function fetchReapprosEnAttente(page = 1) {
    return apiFetch(`finances/reapprovisionnements?page=${page}&per_page=20&statut=en_attente`);
}

export async function fetchReapprosHistorique(page = 1) {
    return apiFetch(`finances/reapprovisionnements/historique?page=${page}&per_page=20`);
}

export async function validerReappro(id, payload) {
    return apiFetch(`finances/reapprovisionnements/${id}/valider`, { method: "POST", body: payload });
}

export async function refuserReappro(id, payload) {
    return apiFetch(`finances/reapprovisionnements/${id}/refuser`, { method: "POST", body: payload });
}
