import { useState, useEffect } from "react";
import { CalendarClock, Search, X, Download, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { formatDate } from "../../../services/ventes.js";
import "../../../assets/styles/components/modules/ventes/reservations.css";

const INITIAL_PRODUCTS = [
    { id: 1, nom: "Produit Alpha", stock_actuel: 20 },
    { id: 2, nom: "Produit Beta",  stock_actuel: 8  },
    { id: 3, nom: "Produit Gamma", stock_actuel: 15 },
];

const INITIAL_RESERVATIONS = [
    { id: 1, produit_id: 1, produit_nom: "Produit Alpha", quantite: 5, statut: "en_cours", commande_id: 10, client: "Dupont Jean",   date: "2026-06-01" },
    { id: 2, produit_id: 1, produit_nom: "Produit Alpha", quantite: 3, statut: "validé",   commande_id: 11, client: "Martin Sophie", date: "2026-06-02" },
    { id: 3, produit_id: 2, produit_nom: "Produit Beta",  quantite: 4, statut: "en_cours", commande_id: 12, client: "Durand Pierre", date: "2026-06-03" },
    { id: 4, produit_id: 3, produit_nom: "Produit Gamma", quantite: 2, statut: "annulé",   commande_id: 13, client: "Leroy Julie",   date: "2026-06-04" },
];

const STATUT_BADGE = {
    en_cours: { label: "En cours",         variant: "warning" },
    "validé": { label: "Validé",           variant: "success" },
    "annulé": { label: "Annulé",           variant: "danger"  },
};

function getReservBadge(statut) {
    return STATUT_BADGE[statut] ?? { label: statut, variant: "neutral" };
}

const PER_PAGE_OPTIONS = [20, 50, 100];

function Reservations() {
    const [products]                                    = useState(INITIAL_PRODUCTS);
    const [reservations]                                = useState(INITIAL_RESERVATIONS);
    const [selectedReservation, setSelectedReservation] = useState(null);

    const [searchQuery,    setSearchQuery]    = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [statusFilter,   setStatusFilter]   = useState("tous");
    const [perPage,        setPerPage]        = useState(20);
    const [page,           setPage]           = useState(1);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => { setPage(1); }, [debouncedQuery, statusFilter]);

    const calculateStockReserve = (productId) =>
        reservations
            .filter((r) => r.produit_id === productId && r.statut === "en_cours")
            .reduce((acc, r) => acc + r.quantite, 0);

    const filteredReservations = reservations.filter((res) => {
        const q = debouncedQuery.toLowerCase();
        const matchSearch =
            !q ||
            res.produit_nom.toLowerCase().includes(q) ||
            res.client.toLowerCase().includes(q) ||
            String(res.id).includes(q);
        const matchStatus = statusFilter === "tous" || res.statut === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages          = Math.ceil(filteredReservations.length / perPage);
    const paginatedReservations = filteredReservations.slice((page - 1) * perPage, page * perPage);

    // KPIs
    const kpis = [
        { label: "Total réservations", value: reservations.length,                                                     variant: "primary" },
        { label: "En cours",           value: reservations.filter((r) => r.statut === "en_cours").length,              variant: "warning" },
        { label: "Validées",           value: reservations.filter((r) => r.statut === "validé").length,                variant: "success" },
        { label: "Annulées",           value: reservations.filter((r) => r.statut === "annulé").length,                variant: "danger"  },
    ];

    return (
        <section className="reservations-root" aria-label="Gestion des réservations">

            {/* Header */}
            <header className="reservations-header">
                <div className="reservations-header__left">
                    <h1 className="reservations-header__title">Réservations</h1>
                    <p className="reservations-header__subtitle">
                        Suivez les réservations de stock liées aux commandes en cours.
                    </p>
                </div>
            </header>

            {/* KPIs */}
            <div className="reservations-kpis" role="region" aria-label="Indicateurs">
                {kpis.map(({ label, value, variant }) => (
                    <div key={label} className={`reservations-kpi reservations-kpi--${variant}`}>
                        <span className="reservations-kpi__value">{value}</span>
                        <span className="reservations-kpi__label">{label}</span>
                    </div>
                ))}
            </div>

            {/* Barre d'outils */}
            <div className="reservations-toolbar">
                <div className="reservations-search">
                    <Search size={16} className="reservations-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="app-input reservations-search__input"
                        placeholder="Rechercher par produit ou client…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Rechercher une réservation"
                    />
                </div>
                <select
                    className="reservations-filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filtrer par statut"
                >
                    <option value="tous">Tous les états</option>
                    <option value="en_cours">En cours</option>
                    <option value="validé">Validé</option>
                    <option value="annulé">Annulé</option>
                </select>
                <select
                    className="reservations-perpage-select"
                    value={perPage}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                    aria-label="Lignes par page"
                >
                    {PER_PAGE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n} / page</option>
                    ))}
                </select>
                <div className="reservations-export-group">
                    <button
                        className="app-button app-button--ghost app-button--sm"
                        onClick={() => alert(`Export CSV — ${filteredReservations.length} lignes`)}
                        type="button"
                    >
                        <Download size={16} aria-hidden="true" />
                        CSV
                    </button>
                    <button
                        className="app-button app-button--ghost app-button--sm"
                        onClick={() => alert(`Export PDF — ${filteredReservations.length} lignes`)}
                        type="button"
                    >
                        <Download size={16} aria-hidden="true" />
                        PDF
                    </button>
                </div>
            </div>

            {/* Liste */}
            {filteredReservations.length === 0 ? (
                <EmptyState
                    icon={<CalendarClock size={36} />}
                    title="Aucune réservation trouvée"
                    desc={debouncedQuery || statusFilter !== "tous"
                        ? "Essayez de modifier vos filtres."
                        : "Aucune réservation enregistrée pour l'instant."
                    }
                />
            ) : (
                <>
                    {/* Desktop : tableau */}
                    <div className="reservations-tableWrap" role="region" aria-label="Liste des réservations">
                        <table className="reservations-table" aria-label="Réservations">
                            <thead className="reservations-table__head">
                                <tr>
                                    <th scope="col">N°</th>
                                    <th scope="col">Produit</th>
                                    <th scope="col">Qté</th>
                                    <th scope="col">Client</th>
                                    <th scope="col">Commande</th>
                                    <th scope="col">Statut</th>
                                    <th scope="col">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedReservations.map((res) => {
                                    const badge = getReservBadge(res.statut);
                                    return (
                                        <tr
                                            key={res.id}
                                            className="reservations-table__row"
                                            onClick={() => setSelectedReservation(res)}
                                        >
                                            <td className="reservations-table__id">#{res.id}</td>
                                            <td className="reservations-table__product">{res.produit_nom}</td>
                                            <td className="reservations-table__qty">{res.quantite}</td>
                                            <td className="reservations-table__client">{res.client}</td>
                                            <td className="reservations-table__order">#{res.commande_id}</td>
                                            <td>
                                                <span className={`ventes-badge ventes-badge--${badge.variant}`}>{badge.label}</span>
                                            </td>
                                            <td className="reservations-table__date">{formatDate(res.date)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile : cartes */}
                    <div className="reservations-cards" aria-label="Réservations">
                        {paginatedReservations.map((res) => {
                            const badge = getReservBadge(res.statut);
                            return (
                                <article
                                    key={res.id}
                                    className="reservations-card"
                                    onClick={() => setSelectedReservation(res)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Réservation #${res.id}`}
                                    onKeyDown={(e) => e.key === "Enter" && setSelectedReservation(res)}
                                >
                                    <div className="reservations-card__top">
                                        <span className="reservations-card__id">#{res.id}</span>
                                        <span className={`ventes-badge ventes-badge--${badge.variant}`}>{badge.label}</span>
                                    </div>
                                    <p className="reservations-card__product">{res.produit_nom}</p>
                                    <div className="reservations-card__meta">
                                        <span className="reservations-card__client">{res.client}</span>
                                        <span className="reservations-card__qty">{res.quantite} unité{res.quantite > 1 ? "s" : ""}</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="reservations-pagination">
                            <span className="reservations-pagination__info">
                                {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredReservations.length)} sur {filteredReservations.length}
                            </span>
                            <div className="reservations-pagination__controls">
                                <button
                                    className="reservations-pagination__btn"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    aria-label="Page précédente"
                                    type="button"
                                >
                                    <ChevronLeft size={16} aria-hidden="true" />
                                </button>
                                <span className="reservations-pagination__page">{page} / {totalPages}</span>
                                <button
                                    className="reservations-pagination__btn"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    aria-label="Page suivante"
                                    type="button"
                                >
                                    <ChevronRight size={16} aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Drawer détail réservation ── */}
            {selectedReservation && (() => {
                const product     = products.find((p) => p.id === selectedReservation.produit_id);
                const stockReserve = calculateStockReserve(selectedReservation.produit_id);
                const stockDispo  = product ? product.stock_actuel - stockReserve : null;
                const badge       = getReservBadge(selectedReservation.statut);
                return (
                    <>
                        <div
                            className="reservations-drawer__overlay"
                            onClick={() => setSelectedReservation(null)}
                            aria-hidden="true"
                        />
                        <aside className="reservations-drawer" aria-label={`Détail réservation #${selectedReservation.id}`}>
                            <div className="reservations-drawer__handle" aria-hidden="true">
                                <span className="reservations-drawer__handle-bar" />
                            </div>
                            <div className="reservations-drawer__header">
                                <h2 className="reservations-drawer__title">Réservation #{selectedReservation.id}</h2>
                                <button
                                    className="reservations-drawer__close"
                                    onClick={() => setSelectedReservation(null)}
                                    aria-label="Fermer"
                                    type="button"
                                >
                                    <X size={18} aria-hidden="true" />
                                </button>
                            </div>
                            <div className="reservations-drawer__body">
                                {/* Infos réservation */}
                                <div className="reservations-detail__block">
                                    <span className="reservations-detail__block-label">Informations</span>
                                    {[
                                        ["Produit réservé",    selectedReservation.produit_nom],
                                        ["Quantité demandée", `${selectedReservation.quantite} unité${selectedReservation.quantite > 1 ? "s" : ""}`],
                                        ["Client lié",        selectedReservation.client],
                                        ["Commande d'origine", `#${selectedReservation.commande_id}`],
                                        ["Date d'enregistrement", formatDate(selectedReservation.date)],
                                    ].map(([k, v]) => (
                                        <div key={k} className="reservations-detail__row">
                                            <span className="reservations-detail__key">{k}</span>
                                            <span className="reservations-detail__val">{v}</span>
                                        </div>
                                    ))}
                                    <div className="reservations-detail__row">
                                        <span className="reservations-detail__key">Statut</span>
                                        <span className="reservations-detail__val">
                                            <span className={`ventes-badge ventes-badge--${badge.variant}`}>{badge.label}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Stock dynamique */}
                                <div className="reservations-detail__block">
                                    <span className="reservations-detail__block-label">
                                        Inventaire en temps réel — {product?.nom ?? "—"}
                                    </span>
                                    {!product ? (
                                        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", padding: "var(--space-2) 0" }}>
                                            Informations sur l'inventaire indisponibles.
                                        </p>
                                    ) : (
                                        <div className="reservations-stock__tableWrap">
                                            <table className="reservations-stock__table">
                                                <thead>
                                                    <tr>
                                                        <th>Indicateur</th>
                                                        <th>Qté</th>
                                                        <th>Mécanisme</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>Stock actuel</td>
                                                        <td>{product.stock_actuel}</td>
                                                        <td>Diminué à la confirmation de livraison</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Stock réservé</td>
                                                        <td>{stockReserve}</td>
                                                        <td>Calculé dynamiquement (commandes en cours)</td>
                                                    </tr>
                                                    <tr className="reservations-stock__table-highlight">
                                                        <td><strong>Stock disponible</strong></td>
                                                        <td><strong>{stockDispo}</strong></td>
                                                        <td><strong>Stock actuel − Stock réservé</strong></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </>
                );
            })()}
        </section>
    );
}

function EmptyState({ icon, title, desc }) {
    return (
        <div className="reservations-empty" role="status">
            <div className="reservations-empty__icon" aria-hidden="true">{icon}</div>
            <h3 className="reservations-empty__title">{title}</h3>
            <p className="reservations-empty__desc">{desc}</p>
        </div>
    );
}

export default Reservations;
