import { apiFetch } from "./api.js";
import { readCache, writeCache } from "./ventesCache.js";

// ─── Constantes de navigation ─────────────────────────────────────────────────

export const VENTES_DASHBOARD    = "Tableau de bord";
export const VENTES_COMMANDES    = "Commandes";
export const VENTES_RESERVATIONS = "Réservations";
export const VENTES_CLIENTS      = "Clients";
export const VENTES_STATISTIQUES = "Statistiques";

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

// ─── Utilitaire interne ───────────────────────────────────────────────────────

function buildQuery(params = {}) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    }
    const s = q.toString();
    return s ? `?${s}` : "";
}

// ─── Commandes ────────────────────────────────────────────────────────────────

/**
 * Liste paginée. Retourne {data: [...], meta: {page, per_page, total, has_more}}
 * — même forme que la réponse backend, exploitable directement par commandes.jsx.
 */
export async function fetchVentesCommandes(params = {}) {
    const qs = buildQuery({ page: 1, per_page: 50, ...params });
    const cacheKey = `commandes${qs}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`ventes/commandes${qs}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les commandes.");
    }
    return result;
}

/** Détail complet : {commande, client, produits, paiements, livraisons} */
export async function fetchVentesCommandeById(id) {
    const cacheKey = `commande_${id}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`ventes/commandes/${id}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le détail de la commande.");
    }
    return result;
}

/** Création d'une commande */
export async function createVentesCommande(body) {
    console.log(JSON.stringify(body));
    return apiFetch("ventes/commandes", { method: "POST", body });
}

/** Annulation d'une commande */
export async function annulerVentesCommande(id, raison) {
    return apiFetch(`ventes/commandes/${id}/annuler`, { method: "POST", body: { 
raison_annulation : raison,
    } });
}

// ─── Clients ──────────────────────────────────────────────────────────────────

/**
 * Liste paginée. Retourne {data: [{id, nom, prenom, email, telephone, commandes, ca_total}], meta}
 */
export async function fetchVentesClients(params = {}) {
    const qs = buildQuery({ page: 1, per_page: 100, ...params });
    const cacheKey = `clients${qs}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`ventes/clients${qs}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les clients.");
    }
    return result;
}

/** Détail client : {client, resume, dernieres_commandes} */
export async function fetchVentesClientById(id) {
    const cacheKey = `client_${id}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`ventes/clients/${id}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le détail du client.");
    }
    return result;
}

/** Création d'un client */
export async function createVentesClient(body) {
    return apiFetch("ventes/clients", { method: "POST", body });
}

// ─── Produits ─────────────────────────────────────────────────────────────────

/**
 * Liste des produits actifs normalisée pour le catalogue commandes.
 * Retourne un tableau [{id, nom, prix_unitaire, reduction, stock, type}].
 */
export async function fetchVentesProduits(params = {}) {
    const qs = buildQuery(params);
    const cacheKey = `produits${qs}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        const res = await apiFetch(`ventes/produits${qs}`);
        result = (res.data ?? []).map(p => ({
            id:            p.id,
            nom:           p.nom ?? "—",
            prix_unitaire: Number(p.prix_unitaire ?? 0),
            reduction:     Number(p.reduction ?? 0),
            stock:         Number(p.stock_disponible ?? p.stock_actuel ?? 0),
            type:          p.type_produit ?? "physique",
        }));
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les produits.");
    }
    return result;
}

// ─── Réservations ─────────────────────────────────────────────────────────────

/**
 * Liste paginée. Retourne {data: [...], meta}.
 * Chaque item : {id (cmdId_prodId), produit_nom, quantite, client, commande_numero, statut, date, stock_*}
 */
export async function fetchVentesReservations(params = {}) {
    const qs = buildQuery({ page: 1, per_page: 100, ...params });
    const cacheKey = `reservations${qs}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`ventes/reservations${qs}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les réservations.");
    }
    return result;
}

/**
 * Détail d'une réservation. itemId est de la forme "commandeId_produitId".
 * Les UUIDs n'ayant pas de "_", le premier "_" est le séparateur.
 */
export async function fetchVentesReservationDetail(itemId) {
    const cacheKey = `reservation_${itemId}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        const sep = itemId.indexOf("_");
        const commandeId = itemId.slice(0, sep);
        const produitId  = itemId.slice(sep + 1);
        result = await apiFetch(`ventes/reservations/${commandeId}/${produitId}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le détail de la réservation.");
    }
    return result;
}

// ─── Statistiques ─────────────────────────────────────────────────────────────

/**
 * KPIs généraux. Retourne directement la réponse backend :
 * {kpis, commandes_en_livraison, commandes_livrees, commandes_annulees, taux_livraison, produits_rupture, produits_stock_faible}
 * — utilisé tel quel par le composant Statistiques > VueGenerale.
 */
export async function fetchVentesStatistiquesGeneral(params = {}) {
    const qs = buildQuery(params);
    const cacheKey = `stats_general${qs}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`ventes/statistiques/general${qs}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les statistiques générales.");
    }
    return result;
}

/**
 * Classement clients. Retourne {top_clients, clients_moins_actifs, ca_max}.
 */
export async function fetchVentesStatistiquesClients(params = {}) {
    const qs = buildQuery(params);
    const cacheKey = `stats_clients${qs}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`ventes/statistiques/clients${qs}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les statistiques clients.");
    }
    return result;
}

/**
 * Statistiques commandes. Retourne {plus_frequentes, moins_frequentes, plus_gros_montants, plus_faibles_montants, montant_max}.
 */
export async function fetchVentesStatistiquesCommandes(params = {}) {
    const qs = buildQuery(params);
    const cacheKey = `stats_commandes${qs}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`ventes/statistiques/commandes${qs}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les statistiques commandes.");
    }
    return result;
}

/**
 * Données composites pour le dashboard ventes.
 * Combine statistiques/general + statistiques/clients en une structure normalisée
 * attendue par dashboard.jsx : {stats, courbe_ca, alertes, activites, top_clients}.
 */
export async function fetchVentesDashboard() {
    const cacheKey = "dashboard_composite";
    const stale = readCache(cacheKey);
    let result;
    try {
        const [general, clients] = await Promise.all([
            apiFetch("ventes/statistiques/general"),
            apiFetch("ventes/statistiques/clients").catch(() => ({})),
        ]);

        const kpis = general.kpis ?? {};

        result = {
            stats: {
                total_commandes:     kpis.nb_commandes               ?? 0,
                commandes_recues:    kpis.nb_commandes               ?? 0,
                commandes_validees:  0,
                livraisons_en_cours: general.commandes_en_livraison  ?? 0,
                commandes_livrees:   general.commandes_livrees       ?? 0,
                commandes_annulees:  general.commandes_annulees      ?? 0,
                clients:             kpis.nb_clients                 ?? 0,
                ca_total:            kpis.ca_total                   ?? 0,
            },
            courbe_ca:   [],
            alertes:     [],
            activites:   [],
            top_clients: (clients.top_clients ?? []).map(c => ({
                id:              c.id,
                nom:             c.nom ?? "—",
                initiales:       (c.nom ?? "").split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?",
                total_commandes: c.commandes ?? 0,
                ca_total:        c.ca        ?? 0,
            })),
        };
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le tableau de bord des ventes.");
    }
    return result;
}

// ─── Notifications ────────────────────────────────────────────────────────────

/** Notifications de ventes non lues. */
export async function fetchVentesNotifications() {
    const cacheKey = "notifications";
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch("ventes/notifications");
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les notifications.");
    }
    return result;
}
