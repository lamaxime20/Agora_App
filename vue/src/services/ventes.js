export const VENTES_DASHBOARD    = "Tableau de bord";
export const VENTES_COMMANDES    = "Commandes";
export const VENTES_RESERVATIONS = "Réservations";
export const VENTES_CLIENTS      = "Clients";
export const VENTES_STATISTIQUES = "Statistiques";

// ─── Helpers partagés ─────────────────────────────────────────────────────────

const BADGE_MAP = {
    "reçu":                  { label: "Reçu",        variant: "info"    },
    "validé":                { label: "Validé",       variant: "primary" },
    "en cours de livraison": { label: "En livraison", variant: "warning" },
    "livré":                 { label: "Livré",        variant: "success" },
    "annulé":                { label: "Annulé",       variant: "danger"  },
    "confirmée":             { label: "Confirmée",    variant: "success" },
    "en attente":            { label: "En attente",   variant: "warning" },
    "annulée":               { label: "Annulée",      variant: "danger"  },
};

export function getBadgeConfig(statut) {
    return BADGE_MAP[statut?.toLowerCase()] ?? { label: statut ?? "—", variant: "neutral" };
}

export function formatMontant(amount) {
    if (amount == null || isNaN(amount)) return "—";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}
