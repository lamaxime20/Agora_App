const CACHE = new Map();
const TTL = 5 * 60 * 1000;

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

function invalidateAll() {
    for (const key of CACHE.keys()) {
        if (key.startsWith('fin-')) CACHE.delete(key);
    }
}

export async function fetchDashboard() {
    const cached = fromCache('fin-dashboard');
    if (cached) return cached;
    const [main, tresorerie, activites] = await Promise.all([
        get('/mock/finances/dashboard.json'),
        get('/mock/finances/dashboard-tresorerie.json'),
        get('/mock/finances/dashboard-activites.json'),
    ]);
    return toCache('fin-dashboard', { main, tresorerie, activites });
}

export async function fetchCommandes(page = 1) {
    const key = `fin-commandes-${page}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const data = await get('/mock/finances/commandes.json');
    return toCache(key, data);
}

export async function fetchCommandeDetail(id) {
    const key = `fin-cmd-${id}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const data = await get(`/mock/finances/commandes/${id}.json`);
    return toCache(key, data);
}

export async function fetchPaiements(page = 1) {
    const key = `fin-paiements-${page}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const data = await get('/mock/finances/paiements.json');
    return toCache(key, data);
}

export async function creerPaiement(_payload) {
    await new Promise(r => setTimeout(r, 700));
    const data = await get('/mock/finances/paiement-create-success.json');
    invalidateAll();
    return data;
}
