export const VENTES_DASHBOARD    = "Tableau de bord";
export const VENTES_COMMANDES    = "Commandes";
export const VENTES_RESERVATIONS = "Réservations";
export const VENTES_CLIENTS      = "Clients";
export const VENTES_STATISTIQUES = "Statistiques";

// ─── Cache TTL ─────────────────────────────────────────────────────────────────
// Cache en mémoire, TTL 30 secondes. Compatible avec les futures vraies API.

const _cache = new Map();

export function fetchWithCache(url, ttl = 30_000) {
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

// ─── Helpers partagés ─────────────────────────────────────────────────────────

const BADGE_MAP = {
    "reçu":                  { label: "Reçu",         variant: "info"    },
    "validé":                { label: "Validé",        variant: "primary" },
    "en cours de livraison": { label: "En livraison",  variant: "warning" },
    "livré":                 { label: "Livré",         variant: "success" },
    "annulé":                { label: "Annulé",        variant: "danger"  },
    "confirmée":             { label: "Confirmée",     variant: "success" },
    "en attente":            { label: "En attente",    variant: "warning" },
    "annulée":               { label: "Annulée",       variant: "danger"  },
    "en_cours":              { label: "En cours",      variant: "warning" },
};

export function getBadgeConfig(statut) {
    return BADGE_MAP[statut?.toLowerCase()] ?? { label: statut ?? "—", variant: "neutral" };
}

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
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(d);
}
