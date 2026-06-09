import { apiFetch } from "./api.js";

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
    return apiFetch(`ventes/commandes${qs}`);
}

/** Détail complet : {commande, client, produits, paiements, livraisons} */
export async function fetchVentesCommandeById(id) {
    return apiFetch(`ventes/commandes/${id}`);
}

/** Création d'une commande */
export async function createVentesCommande(body) {
    return apiFetch("ventes/commandes", { method: "POST", body });
}

/** Annulation d'une commande */
export async function annulerVentesCommande(id, raison) {
    return apiFetch(`ventes/commandes/${id}/annuler`, { method: "POST", body: { raison } });
}

// ─── Clients ──────────────────────────────────────────────────────────────────

/**
 * Liste paginée. Retourne {data: [{id, nom, prenom, email, telephone, commandes, ca_total}], meta}
 */
export async function fetchVentesClients(params = {}) {
    const qs = buildQuery({ page: 1, per_page: 100, ...params });
    return apiFetch(`ventes/clients${qs}`);
}

/** Détail client : {client, resume, dernieres_commandes} */
export async function fetchVentesClientById(id) {
    return apiFetch(`ventes/clients/${id}`);
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
    const res = await apiFetch(`ventes/produits${qs}`);
    return (res.data ?? []).map(p => ({
        id:            p.id,
        nom:           p.nom ?? "—",
        prix_unitaire: Number(p.prix_unitaire ?? 0),
        reduction:     Number(p.reduction ?? 0),
        stock:         Number(p.stock_disponible ?? p.stock_actuel ?? 0),
        type:          p.type_produit ?? "physique",
    }));
}

// ─── Réservations ─────────────────────────────────────────────────────────────

/**
 * Liste paginée. Retourne {data: [...], meta}.
 * Chaque item : {id (cmdId_prodId), produit_nom, quantite, client, commande_numero, statut, date, stock_*}
 */
export async function fetchVentesReservations(params = {}) {
    const qs = buildQuery({ page: 1, per_page: 100, ...params });
    return apiFetch(`ventes/reservations${qs}`);
}

/**
 * Détail d'une réservation. itemId est de la forme "commandeId_produitId".
 * Les UUIDs n'ayant pas de "_", le premier "_" est le séparateur.
 */
export async function fetchVentesReservationDetail(itemId) {
    const sep = itemId.indexOf("_");
    const commandeId = itemId.slice(0, sep);
    const produitId  = itemId.slice(sep + 1);
    return apiFetch(`ventes/reservations/${commandeId}/${produitId}`);
}

// ─── Statistiques ─────────────────────────────────────────────────────────────

/**
 * KPIs généraux. Retourne directement la réponse backend :
 * {kpis, commandes_en_livraison, commandes_livrees, commandes_annulees, taux_livraison, produits_rupture, produits_stock_faible}
 * — utilisé tel quel par le composant Statistiques > VueGenerale.
 */
export async function fetchVentesStatistiquesGeneral(params = {}) {
    const qs = buildQuery(params);
    return apiFetch(`ventes/statistiques/general${qs}`);
}

/**
 * Classement clients. Retourne {top_clients, clients_moins_actifs, ca_max}.
 */
export async function fetchVentesStatistiquesClients(params = {}) {
    const qs = buildQuery(params);
    return apiFetch(`ventes/statistiques/clients${qs}`);
}

/**
 * Statistiques commandes. Retourne {plus_frequentes, moins_frequentes, plus_gros_montants, plus_faibles_montants, montant_max}.
 */
export async function fetchVentesStatistiquesCommandes(params = {}) {
    const qs = buildQuery(params);
    return apiFetch(`ventes/statistiques/commandes${qs}`);
}

/**
 * Données composites pour le dashboard ventes.
 * Combine statistiques/general + statistiques/clients en une structure normalisée
 * attendue par dashboard.jsx : {stats, courbe_ca, alertes, activites, top_clients}.
 */
export async function fetchVentesDashboard() {
    const [general, clients] = await Promise.all([
        apiFetch("ventes/statistiques/general"),
        apiFetch("ventes/statistiques/clients").catch(() => ({})),
    ]);

    const kpis = general.kpis ?? {};

    return {
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
}

// ─── Notifications ────────────────────────────────────────────────────────────

/** Notifications de ventes non lues. */
export async function fetchVentesNotifications() {
    return apiFetch("ventes/notifications");
}
