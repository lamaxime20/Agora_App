import { useState, useEffect, useRef, useCallback } from "react";
import {
    CalendarClock, Search, X, SlidersHorizontal, PackageOpen,
    Package, User, Info, AlertCircle, CheckCircle2, Clock,
    TrendingDown, BarChart2, ChevronRight
} from "lucide-react";
import { fetchWithCache, getBadgeConfig, formatDate } from "../../../services/ventes.js";
import "../../../assets/styles/components/modules/ventes/reservations.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStockLevel(stockDispo, stockActuel) {
    if (!stockActuel || stockActuel === 0) return "critical";
    const ratio = stockDispo / stockActuel;
    if (ratio >= 0.5) return "ok";
    if (ratio >= 0.1) return "low";
    return "critical";
}

function getStockLevelLabel(level) {
    if (level === "ok")       return "Disponible";
    if (level === "low")      return "Faible";
    return "Critique";
}

const STATUT_MAP = {
    "en_cours": { label: "En cours",  variant: "warning" },
    "validé":   { label: "Validé",    variant: "success" },
    "annulé":   { label: "Annulé",    variant: "danger"  },
    "libéré":   { label: "Libéré",    variant: "neutral" },
};

function getReservBadge(statut) {
    return STATUT_MAP[statut] ?? { label: statut ?? "—", variant: "neutral" };
}

const EMPTY_FILTERS = { statut: "tous", produit: "", client: "", dateDebut: "", dateFin: "" };

// ─── Sous-composants ──────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <article className="reservations-card reservations-card--skeleton" aria-hidden="true">
            <div className="reservations-card__top">
                <span className="reservations-skeleton__cell reservations-skeleton__cell--sm" />
                <span className="reservations-skeleton__badge" />
            </div>
            <span className="reservations-skeleton__cell reservations-skeleton__cell--lg" style={{ marginBottom: "var(--space-2)" }} />
            <div className="reservations-card__meta">
                <span className="reservations-skeleton__cell reservations-skeleton__cell--md" />
                <span className="reservations-skeleton__cell reservations-skeleton__cell--sm" />
            </div>
            <div className="reservations-card__stock-row">
                <span className="reservations-skeleton__badge" style={{ width: 70 }} />
                <span className="reservations-skeleton__badge" style={{ width: 70 }} />
                <span className="reservations-skeleton__badge" style={{ width: 80 }} />
            </div>
        </article>
    );
}

function SkeletonRow() {
    return (
        <tr className="reservations-table__row--skeleton" aria-hidden="true">
            {[70, 160, 40, 120, 120, 72, 80].map((w, i) => (
                <td key={i} style={{ padding: "var(--space-4) var(--space-5)" }}>
                    {i === 5
                        ? <span className="reservations-skeleton__badge" />
                        : <span className="reservations-skeleton__cell" style={{ width: w }} />
                    }
                </td>
            ))}
        </tr>
    );
}

function EmptyState({ icon, title, desc, action }) {
    return (
        <div className="reservations-empty" role="status">
            <div className="reservations-empty__icon" aria-hidden="true">{icon}</div>
            <h3 className="reservations-empty__title">{title}</h3>
            <p className="reservations-empty__desc">{desc}</p>
            {action}
        </div>
    );
}

function StockBadge({ label, value, variant }) {
    return (
        <span className={`reservations-stock-badge reservations-stock-badge--${variant}`}>
            <span className="reservations-stock-badge__label">{label}</span>
            <span className="reservations-stock-badge__value">{value}</span>
        </span>
    );
}

function DetailSkeleton() {
    return (
        <div className="reservations-detail__skeleton">
            {[1, 2, 3].map(i => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    <span className="reservations-skeleton__cell reservations-skeleton__cell--sm" style={{ height: 10 }} />
                    {[80, 60, 90, 50].map((w, j) => (
                        <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0" }}>
                            <span className="reservations-skeleton__cell" style={{ width: w }} />
                            <span className="reservations-skeleton__cell" style={{ width: 100 }} />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────────────────────────

function Reservations() {
    // ── Liste ──────────────────────────────────────────────────────────────────
    const [reservations, setReservations] = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [fetchError,   setFetchError]   = useState(null);

    // ── Détail ─────────────────────────────────────────────────────────────────
    const [selectedItem,  setSelectedItem]  = useState(null);
    const [detailData,    setDetailData]    = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError,   setDetailError]   = useState(null);

    // ── Recherche & filtres ────────────────────────────────────────────────────
    const [searchQuery,    setSearchQuery]    = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [showFilters,    setShowFilters]    = useState(false);
    const [filters,        setFilters]        = useState(EMPTY_FILTERS);
    const [pendingFilters, setPendingFilters] = useState(EMPTY_FILTERS);

    // ── Fetch liste ────────────────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        setFetchError(null);
        fetchWithCache("/mock/ventes/reservations/list.json")
            .then(json => setReservations(json.data ?? []))
            .catch(err => setFetchError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // ── Debounce recherche 300ms ───────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // ── Ouverture détail ───────────────────────────────────────────────────────
    const openDetail = useCallback((item) => {
        setSelectedItem(item);
        setDetailData(null);
        setDetailError(null);
        setLoadingDetail(true);
        fetchWithCache(`/mock/ventes/reservations/${item.id}.json`)
            .then(data => setDetailData(data))
            .catch(err => setDetailError(err.message))
            .finally(() => setLoadingDetail(false));
    }, []);

    const closeDetail = useCallback(() => {
        setSelectedItem(null);
        setDetailData(null);
        setDetailError(null);
    }, []);

    // ── Appliquer filtres ──────────────────────────────────────────────────────
    const applyFilters = () => {
        setFilters({ ...pendingFilters });
        setShowFilters(false);
    };

    const resetFilters = () => {
        setPendingFilters(EMPTY_FILTERS);
        setFilters(EMPTY_FILTERS);
        setShowFilters(false);
    };

    const removeFilter = (key) => {
        const next = { ...filters, [key]: key === "statut" ? "tous" : "" };
        setFilters(next);
        setPendingFilters(next);
    };

    // ── Filtrage côté client ───────────────────────────────────────────────────
    const filtered = reservations.filter(r => {
        const q = debouncedQuery.toLowerCase();
        const matchQ = !q ||
            r.produit_nom.toLowerCase().includes(q) ||
            r.client.toLowerCase().includes(q) ||
            r.commande_numero.toLowerCase().includes(q);
        const matchStatut  = filters.statut === "tous" || r.statut === filters.statut;
        const matchProduit = !filters.produit || r.produit_nom.toLowerCase().includes(filters.produit.toLowerCase());
        const matchClient  = !filters.client  || r.client.toLowerCase().includes(filters.client.toLowerCase());
        const matchDate    = (!filters.dateDebut || r.date >= filters.dateDebut) &&
                             (!filters.dateFin   || r.date <= filters.dateFin);
        return matchQ && matchStatut && matchProduit && matchClient && matchDate;
    });

    // ── Pills filtres actifs ───────────────────────────────────────────────────
    const activePills = Object.entries(filters).filter(([k, v]) =>
        k === "statut" ? v !== "tous" : v !== ""
    ).map(([k, v]) => {
        const labels = { statut: "Statut", produit: "Produit", client: "Client", dateDebut: "Du", dateFin: "Au" };
        return { key: k, label: `${labels[k]} : ${v}` };
    });

    const hasActiveFilters = activePills.length > 0;

    // ── KPIs ───────────────────────────────────────────────────────────────────
    const kpis = [
        {
            label: "Total",
            value: reservations.length,
            icon: <Package size={20} />,
            variant: "primary",
        },
        {
            label: "En cours",
            value: reservations.filter(r => r.statut === "en_cours").length,
            icon: <Clock size={20} />,
            variant: "warning",
        },
        {
            label: "Validées",
            value: reservations.filter(r => r.statut === "validé").length,
            icon: <CheckCircle2 size={20} />,
            variant: "success",
        },
        {
            label: "Annulées",
            value: reservations.filter(r => r.statut === "annulé").length,
            icon: <TrendingDown size={20} />,
            variant: "danger",
        },
    ];

    return (
        <section className="reservations-root" aria-label="Gestion des réservations">

            {/* ── Header ── */}
            <header className="reservations-header">
                <div className="reservations-header__left">
                    <h1 className="reservations-header__title">Réservations</h1>
                    <p className="reservations-header__subtitle">
                        Suivez les réservations de stock liées aux commandes en cours.
                    </p>
                </div>
                <button
                    className={`app-button app-button--ghost app-button--sm reservations-filter-btn${hasActiveFilters ? " reservations-filter-btn--active" : ""}`}
                    onClick={() => { setPendingFilters({ ...filters }); setShowFilters(true); }}
                    type="button"
                    aria-label="Filtres"
                >
                    <SlidersHorizontal size={16} aria-hidden="true" />
                    Filtres
                    {hasActiveFilters && <span className="reservations-filter-btn__dot" />}
                </button>
            </header>

            {/* ── KPIs ── */}
            <div className="reservations-kpis" role="region" aria-label="Indicateurs">
                {kpis.map(({ label, value, icon, variant }) => (
                    <div key={label} className={`reservations-kpi reservations-kpi--${variant}`}>
                        <div className={`reservations-kpi__icon reservations-kpi__icon--${variant}`} aria-hidden="true">
                            {icon}
                        </div>
                        <div className="reservations-kpi__body">
                            <span className="reservations-kpi__value">{value}</span>
                            <span className="reservations-kpi__label">{label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Barre outils ── */}
            <div className="reservations-toolbar">
                <div className="reservations-search">
                    <Search size={16} className="reservations-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="app-input reservations-search__input"
                        placeholder="Rechercher par produit, client ou commande…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        aria-label="Rechercher une réservation"
                    />
                    {searchQuery && (
                        <button
                            className="reservations-search__clear"
                            onClick={() => setSearchQuery("")}
                            aria-label="Effacer"
                            type="button"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Pills filtres actifs */}
                {activePills.length > 0 && (
                    <div className="reservations-filter-pills">
                        {activePills.map(({ key, label }) => (
                            <span key={key} className="reservations-filter-pill">
                                {label}
                                <button
                                    onClick={() => removeFilter(key)}
                                    aria-label={`Retirer le filtre ${label}`}
                                    type="button"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={resetFilters}
                            type="button"
                            style={{ fontSize: "var(--text-xs)" }}
                        >
                            Tout effacer
                        </button>
                    </div>
                )}
            </div>

            {/* ── Contenu principal ── */}
            {loading ? (
                <>
                    <div className="reservations-tableWrap" aria-hidden="true">
                        <table className="reservations-table">
                            <thead className="reservations-table__head">
                                <tr>
                                    {["Référence", "Produit", "Qté", "Client", "Commande", "Statut", "Date"].map(h => (
                                        <th key={h} scope="col">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                            </tbody>
                        </table>
                    </div>
                    <div className="reservations-cards" aria-hidden="true">
                        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </>
            ) : fetchError ? (
                <div className="reservations-error-state" role="alert">
                    <AlertCircle size={36} />
                    <p className="reservations-error-state__text">
                        Impossible de charger les réservations.<br />
                        <em>{fetchError}</em>
                    </p>
                    <button
                        className="app-button app-button--primary app-button--sm"
                        onClick={() => {
                            setFetchError(null);
                            setLoading(true);
                            fetchWithCache("/mock/ventes/reservations/list.json")
                                .then(j => setReservations(j.data ?? []))
                                .catch(e => setFetchError(e.message))
                                .finally(() => setLoading(false));
                        }}
                        type="button"
                    >
                        Réessayer
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={<CalendarClock size={36} />}
                    title="Aucune réservation trouvée"
                    desc={
                        debouncedQuery || hasActiveFilters
                            ? "Essayez de modifier vos filtres ou votre recherche."
                            : "Aucune réservation enregistrée pour l'instant."
                    }
                    action={
                        hasActiveFilters && (
                            <button
                                className="app-button app-button--ghost app-button--sm"
                                onClick={resetFilters}
                                type="button"
                            >
                                Effacer les filtres
                            </button>
                        )
                    }
                />
            ) : (
                <>
                    {/* Desktop : tableau */}
                    <div className="reservations-tableWrap" role="region" aria-label="Liste des réservations">
                        <table className="reservations-table">
                            <thead className="reservations-table__head">
                                <tr>
                                    <th scope="col">Référence</th>
                                    <th scope="col">Produit</th>
                                    <th scope="col">Qté réservée</th>
                                    <th scope="col">Client</th>
                                    <th scope="col">Commande</th>
                                    <th scope="col">Stock</th>
                                    <th scope="col">Statut</th>
                                    <th scope="col">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => {
                                    const badge = getReservBadge(r.statut);
                                    const level = getStockLevel(r.stock_disponible, r.stock_actuel);
                                    return (
                                        <tr
                                            key={r.id}
                                            className="reservations-table__row"
                                            onClick={() => openDetail(r)}
                                            tabIndex={0}
                                            onKeyDown={e => e.key === "Enter" && openDetail(r)}
                                            role="button"
                                            aria-label={`Voir détail réservation ${r.id}`}
                                        >
                                            <td className="reservations-table__id">{r.id.toUpperCase()}</td>
                                            <td className="reservations-table__product">{r.produit_nom}</td>
                                            <td className="reservations-table__qty">{r.quantite}</td>
                                            <td className="reservations-table__client">{r.client}</td>
                                            <td className="reservations-table__order">
                                                <span className="reservations-table__order-num">{r.commande_numero}</span>
                                            </td>
                                            <td>
                                                <span className={`reservations-stock-badge reservations-stock-badge--${level}`}>
                                                    {getStockLevelLabel(level)} ({r.stock_disponible})
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`ventes-badge ventes-badge--${badge.variant}`}>{badge.label}</span>
                                            </td>
                                            <td className="reservations-table__date">{formatDate(r.date)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile : cartes */}
                    <div className="reservations-cards" role="list" aria-label="Réservations">
                        {filtered.map(r => {
                            const badge = getReservBadge(r.statut);
                            const level = getStockLevel(r.stock_disponible, r.stock_actuel);
                            return (
                                <article
                                    key={r.id}
                                    className="reservations-card"
                                    onClick={() => openDetail(r)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Réservation ${r.id} — ${r.produit_nom}`}
                                    onKeyDown={e => e.key === "Enter" && openDetail(r)}
                                >
                                    <div className="reservations-card__top">
                                        <span className="reservations-card__id">{r.id.toUpperCase()}</span>
                                        <span className={`ventes-badge ventes-badge--${badge.variant}`}>{badge.label}</span>
                                    </div>

                                    <p className="reservations-card__product">{r.produit_nom}</p>

                                    <div className="reservations-card__meta">
                                        <span className="reservations-card__client">
                                            <User size={12} aria-hidden="true" />
                                            {r.client}
                                        </span>
                                        <span className="reservations-card__order">
                                            <ChevronRight size={12} aria-hidden="true" />
                                            {r.commande_numero}
                                        </span>
                                    </div>

                                    {/* Badges stock */}
                                    <div className="reservations-card__stock-row">
                                        <StockBadge label="Actuel"    value={r.stock_actuel}     variant="neutral" />
                                        <StockBadge label="Réservé"   value={r.stock_reserve}    variant="reserved" />
                                        <StockBadge label={getStockLevelLabel(level)} value={r.stock_disponible} variant={level} />
                                    </div>

                                    {/* Barre de stock */}
                                    <div className="reservations-stock-bar" aria-label={`Stock ${getStockLevelLabel(level)}`}>
                                        <div
                                            className={`reservations-stock-bar__fill reservations-stock-bar__fill--${level}`}
                                            style={{
                                                width: r.stock_actuel > 0
                                                    ? `${Math.round((r.stock_disponible / r.stock_actuel) * 100)}%`
                                                    : "0%"
                                            }}
                                        />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ── Drawer détail ── */}
            {selectedItem && (
                <>
                    <div
                        className="reservations-drawer__overlay"
                        onClick={closeDetail}
                        aria-hidden="true"
                    />
                    <aside
                        className="reservations-drawer"
                        aria-label={`Détail réservation ${selectedItem.id}`}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Handle mobile */}
                        <div className="reservations-drawer__handle" aria-hidden="true">
                            <span className="reservations-drawer__handle-bar" />
                        </div>

                        {/* Header */}
                        <div className="reservations-drawer__header">
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <h2 className="reservations-drawer__title">
                                    {selectedItem.id.toUpperCase()}
                                </h2>
                                <span className={`ventes-badge ventes-badge--${getReservBadge(selectedItem.statut).variant}`}>
                                    {getReservBadge(selectedItem.statut).label}
                                </span>
                            </div>
                            <button
                                className="reservations-drawer__close"
                                onClick={closeDetail}
                                aria-label="Fermer le détail"
                                type="button"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="reservations-drawer__body">
                            {loadingDetail ? (
                                <DetailSkeleton />
                            ) : detailError ? (
                                <DetailFromListItem item={selectedItem} />
                            ) : detailData ? (
                                <DetailFull data={detailData} lightItem={selectedItem} />
                            ) : null}
                        </div>
                    </aside>
                </>
            )}

            {/* ── Bottom sheet filtres ── */}
            {showFilters && (
                <>
                    <div
                        className="reservations-sheet__overlay"
                        onClick={() => setShowFilters(false)}
                        aria-hidden="true"
                    />
                    <div className="reservations-sheet" role="dialog" aria-modal="true" aria-label="Filtres">
                        <div className="reservations-sheet__header">
                            <span className="reservations-sheet__title">Filtres</span>
                            <button
                                className="reservations-drawer__close"
                                onClick={() => setShowFilters(false)}
                                aria-label="Fermer les filtres"
                                type="button"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="reservations-sheet__body">
                            {/* Statut */}
                            <div className="reservations-sheet__field">
                                <label className="reservations-sheet__label" htmlFor="f-statut">Statut</label>
                                <select
                                    id="f-statut"
                                    className="reservations-filter-select"
                                    style={{ width: "100%" }}
                                    value={pendingFilters.statut}
                                    onChange={e => setPendingFilters(p => ({ ...p, statut: e.target.value }))}
                                >
                                    <option value="tous">Tous les statuts</option>
                                    <option value="en_cours">En cours</option>
                                    <option value="validé">Validé</option>
                                    <option value="annulé">Annulé</option>
                                    <option value="libéré">Libéré</option>
                                </select>
                            </div>

                            {/* Produit */}
                            <div className="reservations-sheet__field">
                                <label className="reservations-sheet__label" htmlFor="f-produit">Produit</label>
                                <input
                                    id="f-produit"
                                    type="text"
                                    className="app-input"
                                    placeholder="Nom du produit…"
                                    value={pendingFilters.produit}
                                    onChange={e => setPendingFilters(p => ({ ...p, produit: e.target.value }))}
                                />
                            </div>

                            {/* Client */}
                            <div className="reservations-sheet__field">
                                <label className="reservations-sheet__label" htmlFor="f-client">Client</label>
                                <input
                                    id="f-client"
                                    type="text"
                                    className="app-input"
                                    placeholder="Nom du client…"
                                    value={pendingFilters.client}
                                    onChange={e => setPendingFilters(p => ({ ...p, client: e.target.value }))}
                                />
                            </div>

                            {/* Période */}
                            <div className="reservations-sheet__field">
                                <span className="reservations-sheet__label">Période</span>
                                <div className="reservations-sheet__date-row">
                                    <input
                                        type="date"
                                        className="app-input"
                                        aria-label="Date de début"
                                        value={pendingFilters.dateDebut}
                                        onChange={e => setPendingFilters(p => ({ ...p, dateDebut: e.target.value }))}
                                    />
                                    <span className="reservations-sheet__date-sep">—</span>
                                    <input
                                        type="date"
                                        className="app-input"
                                        aria-label="Date de fin"
                                        value={pendingFilters.dateFin}
                                        onChange={e => setPendingFilters(p => ({ ...p, dateFin: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="reservations-sheet__footer">
                            <button
                                className="app-button app-button--ghost"
                                onClick={resetFilters}
                                type="button"
                                style={{ flex: 1 }}
                            >
                                Réinitialiser
                            </button>
                            <button
                                className="app-button app-button--primary"
                                onClick={applyFilters}
                                type="button"
                                style={{ flex: 2 }}
                            >
                                Appliquer
                            </button>
                        </div>
                    </div>
                </>
            )}

        </section>
    );
}

// ─── Détail depuis les données de liste (fallback si pas de JSON détail) ───────

function DetailFromListItem({ item }) {
    const level = getStockLevel(item.stock_disponible, item.stock_actuel);
    const pct   = item.stock_actuel > 0
        ? Math.round((item.stock_disponible / item.stock_actuel) * 100)
        : 0;

    return (
        <>
            <InfoBlock item={item} />
            <StockBlock
                stockActuel={item.stock_actuel}
                stockReserve={item.stock_reserve}
                stockDispo={item.stock_disponible}
                level={level}
                pct={pct}
                produitNom={item.produit_nom}
            />
            <PedagogyBlock />
        </>
    );
}

// ─── Détail complet (JSON /reservations/${id}.json) ───────────────────────────

function DetailFull({ data, lightItem }) {
    const res  = data.reservation ?? {};
    const prod = data.produit ?? {};
    const cmd  = data.commande ?? {};
    const cli  = data.client ?? {};

    const stockActuel  = prod.stock_actuel    ?? lightItem.stock_actuel;
    const stockReserve = prod.stock_reserve   ?? lightItem.stock_reserve;
    const stockDispo   = prod.stock_disponible ?? lightItem.stock_disponible;
    const level        = getStockLevel(stockDispo, stockActuel);
    const pct          = stockActuel > 0
        ? Math.round((stockDispo / stockActuel) * 100)
        : 0;

    return (
        <>
            {/* Infos réservation */}
            <InfoBlock
                item={{
                    ...lightItem,
                    quantite: res.quantite ?? lightItem.quantite,
                    date:     res.date     ?? lightItem.date,
                    statut:   res.statut   ?? lightItem.statut,
                }}
            />

            {/* Infos client */}
            {cli.nom && (
                <div className="reservations-detail__block">
                    <span className="reservations-detail__block-label">
                        <User size={14} aria-hidden="true" />
                        Client
                    </span>
                    {[
                        ["Nom",       `${cli.prenom ?? ""} ${cli.nom ?? ""}`.trim()],
                        ["Téléphone", cli.telephone ?? "—"],
                        ["Email",     cli.email     ?? "—"],
                    ].map(([k, v]) => (
                        <div key={k} className="reservations-detail__row">
                            <span className="reservations-detail__key">{k}</span>
                            <span className="reservations-detail__val">{v}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Infos commande */}
            {cmd.numero && (
                <div className="reservations-detail__block">
                    <span className="reservations-detail__block-label">Commande liée</span>
                    {[
                        ["Numéro", cmd.numero],
                        ["Statut", cmd.statut],
                        ["Date",   formatDate(cmd.date)],
                    ].map(([k, v]) => (
                        <div key={k} className="reservations-detail__row">
                            <span className="reservations-detail__key">{k}</span>
                            <span className="reservations-detail__val">{v}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Stock */}
            <StockBlock
                stockActuel={stockActuel}
                stockReserve={stockReserve}
                stockDispo={stockDispo}
                level={level}
                pct={pct}
                produitNom={prod.nom ?? lightItem.produit_nom}
            />

            {/* Carte pédagogique */}
            <PedagogyBlock />
        </>
    );
}

// ─── Bloc infos générales ─────────────────────────────────────────────────────

function InfoBlock({ item }) {
    const badge = getReservBadge(item.statut);
    return (
        <div className="reservations-detail__block">
            <span className="reservations-detail__block-label">Informations</span>
            {[
                ["Produit",     item.produit_nom],
                ["Quantité",    `${item.quantite} unité${item.quantite > 1 ? "s" : ""}`],
                ["Client",      item.client],
                ["Commande",    item.commande_numero],
                ["Date",        formatDate(item.date)],
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
    );
}

// ─── Bloc stock avec barre visuelle ───────────────────────────────────────────

function StockBlock({ stockActuel, stockReserve, stockDispo, level, pct, produitNom }) {
    return (
        <div className="reservations-detail__block">
            <span className="reservations-detail__block-label">
                <BarChart2 size={14} aria-hidden="true" />
                Stock — {produitNom}
            </span>

            {/* Badges */}
            <div className="reservations-card__stock-row" style={{ marginBottom: "var(--space-2)" }}>
                <StockBadge label="Actuel"    value={stockActuel}  variant="neutral"  />
                <StockBadge label="Réservé"   value={stockReserve} variant="reserved" />
                <StockBadge label={getStockLevelLabel(level)} value={stockDispo} variant={level} />
            </div>

            {/* Barre */}
            <div className="reservations-stock-bar">
                <div
                    className={`reservations-stock-bar__fill reservations-stock-bar__fill--${level}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="reservations-stock-bar__legend">
                <span>{pct}% disponible</span>
                <span className={`reservations-stock-bar__level reservations-stock-bar__level--${level}`}>
                    {getStockLevelLabel(level)}
                </span>
            </div>

            {/* Ligne tableau */}
            <div className="reservations-stock__tableWrap" style={{ marginTop: "var(--space-3)" }}>
                <table className="reservations-stock__table">
                    <thead>
                        <tr>
                            <th>Indicateur</th>
                            <th>Quantité</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Stock actuel</td>
                            <td>{stockActuel}</td>
                        </tr>
                        <tr>
                            <td>Stock réservé</td>
                            <td>{stockReserve}</td>
                        </tr>
                        <tr className="reservations-stock__table-highlight">
                            <td>Stock disponible</td>
                            <td>{stockDispo}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Carte pédagogique ────────────────────────────────────────────────────────

function PedagogyBlock() {
    return (
        <div className="reservations-pedagogy" role="note">
            <div className="reservations-pedagogy__header">
                <Info size={16} aria-hidden="true" />
                <span>Comment est calculé le stock disponible ?</span>
            </div>
            <p className="reservations-pedagogy__formula">
                Stock disponible = Stock actuel &minus; Stock réservé
            </p>
            <p className="reservations-pedagogy__text">
                Le stock réservé correspond à la somme des quantités bloquées par les commandes
                en cours de validation ou de livraison. Il est mis à jour automatiquement
                à chaque changement de statut de commande.
            </p>
        </div>
    );
}

export default Reservations;
