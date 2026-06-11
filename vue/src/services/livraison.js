import { apiFetch } from './api.js';

// ─── Constantes onglets ────────────────────────────────────────────────────────

export const LIVRAISON_DASHBOARD        = "Tableau de bord";
export const LIVRAISON_COMMANDES        = "Commandes à livrer";
export const LIVRAISON_MES_LIVRAISONS   = "Mes livraisons";
export const LIVRAISON_STATISTIQUES     = "Statistiques";

// ─── Statuts métier ───────────────────────────────────────────────────────────

export const STATUT_EN_COURS = "en_cours";
export const STATUT_LIVREE   = "livree";
export const STATUT_ECHEC    = "echec";
export const STATUT_RETOUR   = "retour";

// ─── Badge configuration ──────────────────────────────────────────────────────

const BADGE_MAP = {
    [STATUT_EN_COURS]: { label: "En cours",  variant: "info"    },
    [STATUT_LIVREE]:   { label: "Livrée",    variant: "success" },
    [STATUT_ECHEC]:    { label: "Échec",     variant: "danger"  },
    [STATUT_RETOUR]:   { label: "Retour",    variant: "warning" },
    "valide":          { label: "Validé",    variant: "success" },
    "partiel":         { label: "Partiel",   variant: "warning" },
};

export function getStatutBadge(statut) {
    return BADGE_MAP[statut?.toLowerCase()] ?? { label: statut ?? "—", variant: "neutral" };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatMontant(amount) {
    if (amount == null || isNaN(amount)) return "—";
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XAF",
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
    }).format(d);
}

export function formatDateTime(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }).format(d);
}

export function formatHeure(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit", minute: "2-digit",
    }).format(d);
}

// ─── Cache localStorage ───────────────────────────────────────────────────────

const LIV_PREFIX = 'liv_';

function livCacheRead(key) {
    try {
        const raw = localStorage.getItem(LIV_PREFIX + key);
        if (!raw) return null;
        const { data, expiresAt } = JSON.parse(raw);
        if (Date.now() > expiresAt) return null;
        return data;
    } catch {
        return null;
    }
}

function livCacheWrite(key, data, ttl) {
    try {
        localStorage.setItem(LIV_PREFIX + key, JSON.stringify({
            data,
            expiresAt: Date.now() + ttl,
        }));
    } catch {
        // quota dépassé, on ignore
    }
}

export function livCacheClear(prefix) {
    const fullPrefix = LIV_PREFIX + prefix;
    Object.keys(localStorage)
        .filter(k => k.startsWith(fullPrefix))
        .forEach(k => localStorage.removeItem(k));
}

// ─── Query builder ────────────────────────────────────────────────────────────

function buildQuery(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
            qs.append(k, String(v));
        }
    });
    const str = qs.toString();
    return str ? '?' + str : '';
}

// ─── Fetch factory ────────────────────────────────────────────────────────────
// Appelle l'API, écrit en cache si succès.
// Sur erreur, l'exception remonte : le composant conserve le stale et affiche l'erreur.

async function livFetch(cacheKey, endpoint, ttl) {
    const data = await apiFetch(endpoint);
    livCacheWrite(cacheKey, data, ttl);
    return data;
}

// ─── CACHE — lectures synchrones (useState lazy init) ─────────────────────────

export const CACHE = {
    readDashboard:            (p = {}) => livCacheRead(`dashboard${buildQuery(p)}`),
    readCommandesALivrer:     (p = {}) => livCacheRead(`cmd_a_livrer${buildQuery(p)}`),
    readHistoriqueLivraisons: (p = {}) => livCacheRead(`historique${buildQuery(p)}`),
    readLivreurs:             (p = {}) => livCacheRead(`livreurs${buildQuery(p)}`),
    readMesLivraisons:        ()       => livCacheRead('mes_livraisons'),
    readHistoriquePersonnel:  (p = {}) => livCacheRead(`mes_historique${buildQuery(p)}`),
    readStatisticsOverview:   (p = {}) => livCacheRead(`stats_general${buildQuery(p)}`),
    readStatisticsDrivers:    (p = {}) => livCacheRead(`stats_livreurs${buildQuery(p)}`),
    readStatisticsActivity:   (p = {}) => livCacheRead(`stats_activite${buildQuery(p)}`),
    readStatisticsFailures:   (p = {}) => livCacheRead(`stats_echecs${buildQuery(p)}`),
    readStatisticsReturns:    (p = {}) => livCacheRead(`stats_retours${buildQuery(p)}`),
    readStatisticsGeography:  (p = {}) => livCacheRead(`stats_geo${buildQuery(p)}`),
    readStatisticsClients:    (p = {}) => livCacheRead(`stats_clients${buildQuery(p)}`),
};

// ─── API — lecture ────────────────────────────────────────────────────────────

export function fetchDashboard(params = {}) {
    const q = buildQuery(params);
    return livFetch(`dashboard${q}`, `livraisons/dashboard${q}`, 120_000);
}

export function fetchCommandesALivrer(params = {}) {
    const q = buildQuery(params);
    return livFetch(`cmd_a_livrer${q}`, `livraisons/commandes-a-livrer${q}`, 60_000);
}

export function fetchHistoriqueLivraisons(params = {}) {
    const q = buildQuery(params);
    return livFetch(`historique${q}`, `livraisons/historique${q}`, 120_000);
}

export function fetchLivraisonDetail(id) {
    return apiFetch(`livraisons/${id}`);
}

export function fetchLivreurs(params = {}) {
    const q = buildQuery(params);
    return livFetch(`livreurs${q}`, `livraisons/livreurs${q}`, 300_000);
}

export function fetchMesLivraisons() {
    return livFetch('mes_livraisons', 'livraisons/mes-livraisons', 60_000);
}

export function fetchHistoriquePersonnel(params = {}) {
    const q = buildQuery(params);
    return livFetch(`mes_historique${q}`, `livraisons/mes-livraisons/historique${q}`, 120_000);
}

export function fetchStatisticsOverview(params = {}) {
    const q = buildQuery(params);
    return livFetch(`stats_general${q}`, `livraisons/statistiques/general${q}`, 300_000);
}

export function fetchStatisticsDrivers(params = {}) {
    const q = buildQuery(params);
    return livFetch(`stats_livreurs${q}`, `livraisons/statistiques/livreurs${q}`, 300_000);
}

export function fetchStatisticsActivity(params = {}) {
    const q = buildQuery(params);
    return livFetch(`stats_activite${q}`, `livraisons/statistiques/activite${q}`, 300_000);
}

export function fetchStatisticsFailures(params = {}) {
    const q = buildQuery(params);
    return livFetch(`stats_echecs${q}`, `livraisons/statistiques/echecs${q}`, 300_000);
}

export function fetchStatisticsReturns(params = {}) {
    const q = buildQuery(params);
    return livFetch(`stats_retours${q}`, `livraisons/statistiques/retours${q}`, 300_000);
}

export function fetchStatisticsGeography(params = {}) {
    const q = buildQuery(params);
    return livFetch(`stats_geo${q}`, `livraisons/statistiques/geographie${q}`, 300_000);
}

export function fetchStatisticsClients(params = {}) {
    const q = buildQuery(params);
    return livFetch(`stats_clients${q}`, `livraisons/statistiques/clients${q}`, 300_000);
}

// ─── API — mutations ──────────────────────────────────────────────────────────

export async function createLivraison(commandeId, livreurId) {
    livCacheClear('cmd_a_livrer');
    livCacheClear('historique');
    livCacheClear('stats_');
    return apiFetch('livraisons', { method: 'POST', body: { commande_id: commandeId, livreur_id: livreurId } });
}

export async function lancerLivraison(id) {
    livCacheClear('mes_livraisons');
    return apiFetch(`livraisons/${id}/lancer`, { method: 'POST' });
}

export async function validerLivraison(id) {
    livCacheClear('mes_livraisons');
    livCacheClear('mes_historique');
    livCacheClear('historique');
    livCacheClear('dashboard');
    livCacheClear('stats_');
    return apiFetch(`livraisons/${id}/valider`, { method: 'POST' });
}

export async function echecLivraison(id, motif) {
    livCacheClear('mes_livraisons');
    livCacheClear('mes_historique');
    livCacheClear('historique');
    livCacheClear('stats_');
    return apiFetch(`livraisons/${id}/echec`, { method: 'POST', body: { motif } });
}

export async function retourLivraison(id, motif) {
    livCacheClear('mes_livraisons');
    livCacheClear('mes_historique');
    livCacheClear('historique');
    livCacheClear('stats_');
    return apiFetch(`livraisons/${id}/retour`, { method: 'POST', body: { motif } });
}

export async function annulerLivraison(id, motif) {
    livCacheClear('cmd_a_livrer');
    livCacheClear('historique');
    livCacheClear('stats_');
    return apiFetch(`livraisons/${id}/annuler`, { method: 'POST', body: { motif } });
}

export function exportLivraisons(format = 'pdf') {
    return apiFetch(`livraisons/historique/export?format=${format}`);
}
