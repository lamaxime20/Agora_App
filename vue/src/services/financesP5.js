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

// ─── SALAIRES ───────────────────────────────────────────────────────────────

export async function fetchSalaires(page = 1, filtreStatut = "tous") {
    const key = `finp5-sal-${page}-${filtreStatut}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/salaires.json');
    const all = (raw.data ?? []).filter(e =>
        filtreStatut === "tous" ? true : e.statut === filtreStatut
    );
    const start = (page - 1) * PER_PAGE;
    const data = all.slice(start, start + PER_PAGE);
    return toCache(key, {
        data,
        meta: { ...raw.meta, page, per_page: PER_PAGE, total: all.length },
        all: raw.data ?? [],
    });
}

export async function fetchSalarieDetail(id) {
    const key = `finp5-sal-detail-${id}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/salaires.json');
    const detail = (raw.data ?? []).find(e => e.id === id) ?? null;
    return toCache(key, detail);
}

export async function fetchSalairePaiements(employeeId, page = 1) {
    const key = `finp5-sal-pay-${employeeId}-${page}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/salaires.json');
    const employee = (raw.data ?? []).find(e => e.id === employeeId);
    const allPaiements = employee?.paiementsRecents ?? [];
    const start = (page - 1) * PER_PAGE;
    const data = allPaiements.slice(start, start + PER_PAGE);
    return toCache(key, { data, meta: { page, per_page: PER_PAGE, total: allPaiements.length } });
}

// ─── JOURNAL FINANCIER ──────────────────────────────────────────────────────

export async function fetchJournalFinancier(page = 1, filters = {}) {
    const filterKey = JSON.stringify(filters);
    const key = `finp5-journal-${page}-${filterKey}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/finance-journal-financier.json');
    let all = raw.data ?? [];

    if (filters.recherche) {
        const q = filters.recherche.toLowerCase();
        all = all.filter(m =>
            m.description.toLowerCase().includes(q) ||
            m.reference.toLowerCase().includes(q) ||
            m.utilisateur.toLowerCase().includes(q) ||
            m.type.toLowerCase().includes(q)
        );
    }
    if (filters.type && filters.type !== "tous") {
        all = all.filter(m => m.type === filters.type);
    }
    if (filters.sens && filters.sens !== "tous") {
        all = all.filter(m => m.sens === filters.sens);
    }
    if (filters.dateDebut) {
        all = all.filter(m => m.date >= filters.dateDebut);
    }
    if (filters.dateFin) {
        all = all.filter(m => m.date <= filters.dateFin);
    }

    const start = (page - 1) * PER_PAGE;
    const data = all.slice(start, start + PER_PAGE);
    return toCache(key, {
        data,
        meta: { page, per_page: PER_PAGE, total: all.length },
        kpis: raw.kpis,
    });
}

export async function fetchMouvementDetail(id) {
    const key = `finp5-journal-detail-${id}`;
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/finance-journal-financier.json');
    const detail = (raw.data ?? []).find(m => m.id === id) ?? null;
    return toCache(key, detail);
}

// ─── STATISTIQUES ───────────────────────────────────────────────────────────

export async function fetchStatsVueGenerale() {
    const key = 'finp5-stats-generale';
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/finance-stats-vue-generale.json');
    return toCache(key, raw.data);
}

export async function fetchStatsTresorerie() {
    const key = 'finp5-stats-tresorerie';
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/finance-stats-tresorerie.json');
    return toCache(key, raw.data);
}

export async function fetchStatsAutres() {
    const key = 'finp5-stats-autres';
    const cached = fromCache(key);
    if (cached) return cached;
    const raw = await get('/mock/finances/finance-stats-autres.json');
    return toCache(key, raw.data);
}
