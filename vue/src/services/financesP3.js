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

// ─── REMBOURSEMENTS ─────────────────────────────────────────────────────────────

export async function fetchRemboursements(page = 1) {
    const key = `finp3-remb-${page}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/remboursements.json');
    const all = raw.data ?? raw.remboursements ?? [];
    const start = (page - 1) * PER_PAGE;
    const data = all.slice(start, start + PER_PAGE);
    return toCache(key, { data, meta: { page, per_page: PER_PAGE, total: all.length } });
}

export async function fetchCommandesRemboursables() {
    const key = 'finp3-cmd-remb';
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/commandes-remboursables.json');
    return toCache(key, raw.data ?? raw.commandes ?? []);
}

export async function creerRemboursement(_payload) {
    await new Promise(r => setTimeout(r, 850));
    const res = await get('/mock/finances/remboursement-create-success.json');
    invalidatePrefix('finp3-remb');
    return res;
}

// ─── DÉPENSES ───────────────────────────────────────────────────────────────────

export async function fetchDepenses(page = 1) {
    const key = `finp3-dep-${page}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/depenses.json');
    const all = raw.data ?? raw.depenses ?? [];
    const start = (page - 1) * PER_PAGE;
    const data = all.slice(start, start + PER_PAGE);
    return toCache(key, { data, meta: { page, per_page: PER_PAGE, total: all.length } });
}

export async function creerDepense(_payload) {
    await new Promise(r => setTimeout(r, 700));
    const res = await get('/mock/finances/depense-create-success.json');
    invalidatePrefix('finp3-dep');
    return res;
}

// ─── ENTRÉES ────────────────────────────────────────────────────────────────────

export async function fetchEntrees(page = 1) {
    const key = `finp3-ent-${page}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/entrees.json');
    const all = raw.data ?? raw.entrees ?? [];
    const start = (page - 1) * PER_PAGE;
    const data = all.slice(start, start + PER_PAGE);
    return toCache(key, { data, meta: { page, per_page: PER_PAGE, total: all.length } });
}

export async function creerEntree(_payload) {
    await new Promise(r => setTimeout(r, 700));
    const res = await get('/mock/finances/entree-create-success.json');
    invalidatePrefix('finp3-ent');
    return res;
}
