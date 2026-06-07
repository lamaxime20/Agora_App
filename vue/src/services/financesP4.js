const CACHE = new Map();
const TTL = 5 * 60 * 1000;
const PER_PAGE = 20;

function fromCache(key) {
    const entry = CACHE.get(key);
    return entry && Date.now() - entry.ts < TTL ? entry.data : null;
}

function toCache(key, data) {
    CACHE.set(key, { data, ts: Date.now() });
    return data;
}

async function get(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur réseau : ${res.status}`);
    return res.json();
}

function invalidatePrefix(prefix) {
    for (const key of CACHE.keys()) {
        if (key.startsWith(prefix)) CACHE.delete(key);
    }
}

// ─── ABONNEMENTS ────────────────────────────────────────────────────────────────

export async function fetchAbonnements(page = 1, filtreStatut = "tous") {
    const key = `finp4-abo-${page}-${filtreStatut}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/abonnements.json');
    const all = (raw.data ?? []).filter(a =>
        filtreStatut === "tous" ? true :
        filtreStatut === "actif" ? a.statut === "actif" :
        a.statut === "resilié" || a.statut === "resilié"
    );
    const start = (page - 1) * PER_PAGE;
    const data = all.slice(start, start + PER_PAGE);
    return toCache(key, { data, meta: { page, per_page: PER_PAGE, total: all.length }, all: raw.data ?? [] });
}

export async function fetchAbonnementDetail(id) {
    const key = `finp4-abo-detail-${id}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/abonnements.json');
    const detail = (raw.data ?? []).find(a => a.id === id) ?? null;
    return toCache(key, detail);
}

export async function creerAbonnement(_payload) {
    await new Promise(r => setTimeout(r, 800));
    const res = await get('/mock/finances/abonnement-create-success.json');
    invalidatePrefix('finp4-abo');
    return res;
}

export async function suspendreAbonnement(_id, _payload) {
    await new Promise(r => setTimeout(r, 700));
    const res = await get('/mock/finances/abonnement-suspend-success.json');
    invalidatePrefix('finp4-abo');
    return res;
}

export async function reactiverAbonnement(_id, _payload) {
    await new Promise(r => setTimeout(r, 700));
    const res = await get('/mock/finances/abonnement-reactiver-success.json');
    invalidatePrefix('finp4-abo');
    return res;
}

// ─── RÉAPPROVISIONNEMENTS ───────────────────────────────────────────────────────

export async function fetchReapprosEnAttente(page = 1) {
    const key = `finp4-reapp-attente-${page}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/reapprovisionnements-attente.json');
    const all = raw.data ?? [];
    const start = (page - 1) * PER_PAGE;
    const data = all.slice(start, start + PER_PAGE);
    return toCache(key, { data, meta: { page, per_page: PER_PAGE, total: all.length }, all });
}

export async function fetchReapprosHistorique(page = 1) {
    const key = `finp4-reapp-hist-${page}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/reapprovisionnements.json');
    const all = raw.data ?? [];
    const start = (page - 1) * PER_PAGE;
    const data = all.slice(start, start + PER_PAGE);
    return toCache(key, { data, meta: { page, per_page: PER_PAGE, total: all.length } });
}

export async function validerReappro(_id, _payload) {
    await new Promise(r => setTimeout(r, 1000));
    const res = await get('/mock/finances/reappro-valider-success.json');
    invalidatePrefix('finp4-reapp');
    return res;
}

export async function refuserReappro(_id, _payload) {
    await new Promise(r => setTimeout(r, 700));
    const res = await get('/mock/finances/reappro-refuser-success.json');
    invalidatePrefix('finp4-reapp');
    return res;
}
