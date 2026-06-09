import { apiFetch } from "./api.js";

// ─── REMBOURSEMENTS ─────────────────────────────────────────────────────────────

export async function fetchRemboursements(page = 1) {
    return apiFetch(`finances/remboursements?page=${page}&per_page=20`);
}

export async function fetchCommandesRemboursables() {
    const res = await apiFetch("finances/commandes-remboursables");
    return res.data ?? res.commandes ?? res ?? [];
}

export async function creerRemboursement(payload) {
    return apiFetch("finances/remboursements", { method: "POST", body: payload });
}

// ─── DÉPENSES ───────────────────────────────────────────────────────────────────

export async function fetchDepenses(page = 1) {
    return apiFetch(`finances/depenses?page=${page}&per_page=20`);
}

export async function creerDepense(payload) {
    return apiFetch("finances/depenses", { method: "POST", body: payload });
}

// ─── ENTRÉES ────────────────────────────────────────────────────────────────────

export async function fetchEntrees(page = 1) {
    return apiFetch(`finances/entrees?page=${page}&per_page=20`);
}

export async function creerEntree(payload) {
    return apiFetch("finances/entrees", { method: "POST", body: payload });
}
