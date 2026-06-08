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

// ─── Cache en mémoire ─────────────────────────────────────────────────────────
// TTL par défaut : 5 minutes (300 000 ms)

const _cache = new Map();

export function fetchWithCache(url, ttl = 300_000) {
    const now = Date.now();
    const hit = _cache.get(url);
    if (hit && now - hit.ts < ttl) return Promise.resolve(hit.data);
    return fetch(url)
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status} — ${url}`);
            return r.json();
        })
        .then(data => {
            _cache.set(url, { ts: now, data });
            return data;
        });
}

export function invalidateCache(url) {
    if (url) _cache.delete(url);
    else _cache.clear();
}

// ─── API mock — lecture ───────────────────────────────────────────────────────

export function fetchDashboard() {
    return fetchWithCache("/mock/livraison/dashboard.json");
}

export function fetchCommandesALivrer(page = 1) {
    return fetchWithCache(`/mock/livraison/commandes-a-livrer.json?page=${page}`, 60_000);
}

export function fetchHistoriqueLivraisons(page = 1) {
    return fetchWithCache(`/mock/livraison/historique.json?page=${page}`, 120_000);
}

export function fetchLivreurs() {
    return fetchWithCache("/mock/livraison/livreurs.json", 300_000);
}

export function fetchMesLivraisons() {
    return fetchWithCache("/mock/livraison/mes-livraisons.json", 60_000);
}

export function fetchHistoriquePersonnel(page = 1) {
    return fetchWithCache(`/mock/livraison/historique-personnel.json?page=${page}`, 120_000);
}

// Statistiques
export function fetchStatisticsOverview() {
    return fetchWithCache("/mock/livraison/statistics/overview.json");
}
export function fetchStatisticsDrivers() {
    return fetchWithCache("/mock/livraison/statistics/drivers.json");
}
export function fetchStatisticsActivity() {
    return fetchWithCache("/mock/livraison/statistics/activity.json");
}
export function fetchStatisticsFailures() {
    return fetchWithCache("/mock/livraison/statistics/failures.json");
}
export function fetchStatisticsReturns() {
    return fetchWithCache("/mock/livraison/statistics/returns.json");
}
export function fetchStatisticsGeography() {
    return fetchWithCache("/mock/livraison/statistics/geography.json");
}
export function fetchStatisticsClients() {
    return fetchWithCache("/mock/livraison/statistics/clients.json");
}

// ─── API mock — mutations (POST simulés) ──────────────────────────────────────

async function postMock(url, _body) {
    return fetch(url).then(r => r.json());
}

export function createLivraison(commandeId, livreurId) {
    invalidateCache("/mock/livraison/commandes-a-livrer.json");
    invalidateCache("/mock/livraison/historique.json");
    return postMock("/mock/livraison/create.json", { commandeId, livreurId });
}

export function lancerLivraison(livraisonId) {
    invalidateCache("/mock/livraison/mes-livraisons.json");
    return postMock("/mock/livraison/start.json", { livraisonId });
}

export function validerLivraison(livraisonId) {
    invalidateCache("/mock/livraison/mes-livraisons.json");
    invalidateCache("/mock/livraison/historique-personnel.json");
    return postMock("/mock/livraison/validate.json", { livraisonId });
}

export function echecLivraison(livraisonId, motif) {
    invalidateCache("/mock/livraison/mes-livraisons.json");
    return postMock("/mock/livraison/echec.json", { livraisonId, motif });
}

export function retourLivraison(livraisonId, motif) {
    invalidateCache("/mock/livraison/mes-livraisons.json");
    return postMock("/mock/livraison/retour.json", { livraisonId, motif });
}

export function annulerLivraison(livraisonId, motif) {
    invalidateCache("/mock/livraison/mes-livraisons.json");
    return postMock("/mock/livraison/cancel.json", { livraisonId, motif });
}

export function exportLivraisons(format) {
    const urls = {
        pdf:  "/mock/livraison/export-pdf.json",
        csv:  "/mock/livraison/export-csv.json",
        docx: "/mock/livraison/export-docx.json",
    };
    return fetch(urls[format] ?? urls.pdf).then(r => r.json());
}
