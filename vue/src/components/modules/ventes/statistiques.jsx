import { useState, useEffect } from "react";
import {
    BarChart2, Users, ShoppingBag, Package,
    TrendingUp, TrendingDown, Truck, CheckCircle2,
    XCircle, AlertTriangle, Award, ChevronUp, ChevronDown,
    Download, Filter, X
} from "lucide-react";
import { readCache } from "../../../services/ventesCache.js";
import { formatMontant, formatDate, fetchVentesStatistiquesGeneral, fetchVentesStatistiquesClients, fetchVentesStatistiquesCommandes } from "../../../services/ventes.js";
import { exportVentesStatistiques } from "../../../services/exportService.js";
import "../../../assets/styles/components/modules/ventes/statistiques.css";

// ─── Configuration des onglets ─────────────────────────────────────────────────

const TABS = [
    { id: "general",   label: "Vue générale" },
    { id: "clients",   label: "Clients"      },
    { id: "commandes", label: "Commandes"    },
];

// ─── Sous-composants ──────────────────────────────────────────────────────────

function SkeletonKpi() {
    return (
        <div className="stats-kpi stats-kpi--skeleton" aria-hidden="true">
            <div className="stats-skeleton__icon" />
            <span className="stats-skeleton__cell stats-skeleton__cell--sm" style={{ height: 11, marginTop: 8 }} />
            <span className="stats-skeleton__cell stats-skeleton__cell--md" style={{ height: 22, marginTop: 6 }} />
        </div>
    );
}

function SkeletonRanking({ rows = 5 }) {
    return (
        <div className="stats-ranking" aria-hidden="true">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="stats-ranking__row stats-ranking__row--skeleton">
                    <span className="stats-ranking__pos stats-skeleton__cell" style={{ width: 24, height: 24 }} />
                    <div className="stats-ranking__info">
                        <span className="stats-skeleton__cell stats-skeleton__cell--lg" style={{ height: 12 }} />
                        <span className="stats-ranking__bar-wrap">
                            <span className="stats-skeleton__cell" style={{ width: "100%", height: 6, borderRadius: "var(--radius-full)" }} />
                        </span>
                    </div>
                    <span className="stats-skeleton__cell stats-skeleton__cell--sm" style={{ height: 12 }} />
                </div>
            ))}
        </div>
    );
}

function ErrorState({ message, onRetry }) {
    return (
        <div className="stats-error" role="alert">
            <AlertTriangle size={36} />
            <p className="stats-error__text">Impossible de charger les statistiques.<br /><em>{message}</em></p>
            <button className="app-button app-button--primary app-button--sm" onClick={onRetry} type="button">
                Réessayer
            </button>
        </div>
    );
}

function EmptySection({ label }) {
    return (
        <div className="stats-empty" role="status">
            <BarChart2 size={32} />
            <p>Aucune donnée disponible pour « {label} ».</p>
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────────────────────────

function Statistiques() {
    const [activeTab, setActiveTab] = useState("general");

    const [generalData,   setGeneralData]   = useState(null);
    const [clientsData,   setClientsData]   = useState(null);
    const [commandesData, setCommandesData] = useState(null);

    const [loadingGeneral,   setLoadingGeneral]   = useState(true);
    const [loadingClients,   setLoadingClients]   = useState(false);
    const [loadingCommandes, setLoadingCommandes] = useState(false);

    const [errorGeneral,   setErrorGeneral]   = useState(null);
    const [errorClients,   setErrorClients]   = useState(null);
    const [errorCommandes, setErrorCommandes] = useState(null);

    const [showFilter,   setShowFilter]   = useState(false);
    const [exportOpen,   setExportOpen]   = useState(false);
    const [dateDebut,    setDateDebut]    = useState("");
    const [dateFin,      setDateFin]      = useState("");
    const [activeFilter, setActiveFilter] = useState({ dateDebut: "", dateFin: "" });
    const [exporting, setExporting]       = useState(null);

    // ── Fetch vue générale au montage ou changement de filtre ─────────────────
    useEffect(() => {
        setLoadingGeneral(true);
        setErrorGeneral(null);
        setGeneralData(null);
        setClientsData(null);
        setCommandesData(null);

        const params = {};
        if (activeFilter.dateDebut) params.date_debut = activeFilter.dateDebut;
        if (activeFilter.dateFin)   params.date_fin   = activeFilter.dateFin;

        fetchVentesStatistiquesGeneral(params)
            .then(d => setGeneralData(d))
            .catch(e => setErrorGeneral(e.message))
            .finally(() => setLoadingGeneral(false));
    }, [activeFilter]);

    // ── Fetch au changement d'onglet ───────────────────────────────────────────
    useEffect(() => {
        const params = {};
        if (activeFilter.dateDebut) params.date_debut = activeFilter.dateDebut;
        if (activeFilter.dateFin)   params.date_fin   = activeFilter.dateFin;

        if (activeTab === "clients" && !clientsData && !loadingClients) {
            setLoadingClients(true);
            fetchVentesStatistiquesClients(params)
                .then(d => setClientsData(d))
                .catch(e => setErrorClients(e.message))
                .finally(() => setLoadingClients(false));
        }
        if (activeTab === "commandes" && !commandesData && !loadingCommandes) {
            setLoadingCommandes(true);
            fetchVentesStatistiquesCommandes(params)
                .then(d => setCommandesData(d))
                .catch(e => setErrorCommandes(e.message))
                .finally(() => setLoadingCommandes(false));
        }
    }, [activeTab, clientsData, loadingClients, commandesData, loadingCommandes, activeFilter]);

    const getParams = () => {
        const p = {};
        if (activeFilter.dateDebut) p.date_debut = activeFilter.dateDebut;
        if (activeFilter.dateFin)   p.date_fin   = activeFilter.dateFin;
        return p;
    };

    const retryGeneral = () => {
        setErrorGeneral(null);
        setLoadingGeneral(true);
        fetchVentesStatistiquesGeneral(getParams())
            .then(d => setGeneralData(d))
            .catch(e => setErrorGeneral(e.message))
            .finally(() => setLoadingGeneral(false));
    };

    const retryClients = () => {
        setErrorClients(null);
        setClientsData(null);
        setLoadingClients(true);
        fetchVentesStatistiquesClients(getParams())
            .then(d => setClientsData(d))
            .catch(e => setErrorClients(e.message))
            .finally(() => setLoadingClients(false));
    };

    const retryCommandes = () => {
        setErrorCommandes(null);
        setCommandesData(null);
        setLoadingCommandes(true);
        fetchVentesStatistiquesCommandes(getParams())
            .then(d => setCommandesData(d))
            .catch(e => setErrorCommandes(e.message))
            .finally(() => setLoadingCommandes(false));
    };

    const applyFilter = () => {
        setActiveFilter({ dateDebut, dateFin });
        setShowFilter(false);
    };

    const clearFilter = () => {
        setDateDebut("");
        setDateFin("");
        setActiveFilter({ dateDebut: "", dateFin: "" });
        setShowFilter(false);
    };

    const hasActiveFilter = activeFilter.dateDebut || activeFilter.dateFin;

    async function handleExportStatistiques(fmt) {
        if (exporting) return;
        setExporting(fmt);
        setExportOpen(false);
        try {
            await exportVentesStatistiques(fmt, {
                date_debut: activeFilter.dateDebut,
                date_fin: activeFilter.dateFin,
            });
        } catch { /* silencieux */ } finally {
            setExporting(null);
        }
    }

    return (
        <section className="statistiques-root" aria-label="Statistiques Vente">

            {/* ── Header ── */}
            <header className="statistiques-header">
                <div className="statistiques-header__top">
                    <div>
                        <h1 className="statistiques-header__title">Statistiques</h1>
                        <p className="statistiques-header__subtitle">
                            Analysez les performances de votre activité commerciale.
                            {hasActiveFilter && (
                                <span className="statistiques-header__filter-badge">
                                    {activeFilter.dateDebut && `Du ${activeFilter.dateDebut}`}
                                    {activeFilter.dateDebut && activeFilter.dateFin && " "}
                                    {activeFilter.dateFin && `au ${activeFilter.dateFin}`}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="statistiques-header__actions">
                        <button
                            className={`app-button app-button--sm${hasActiveFilter ? " app-button--primary" : " app-button--ghost"}`}
                            onClick={() => setShowFilter(true)}
                            type="button"
                            aria-label="Filtrer les statistiques"
                        >
                            <Filter size={16} aria-hidden="true" />
                            Filtrer
                        </button>
                        <div style={{ position: "relative" }}>
                            <button
                                className="app-button app-button--ghost app-button--sm"
                                onClick={() => setExportOpen(v => !v)}
                                type="button"
                                aria-expanded={exportOpen}
                                aria-haspopup="menu"
                            >
                                <Download size={16} aria-hidden="true" />
                                Exporter
                                <ChevronDown size={14} aria-hidden="true" />
                            </button>
                            {exportOpen && (
                                <div className="statistiques-export-menu" role="menu">
                                    {["CSV", "PDF", "DOCX"].map(fmt => {
                                        const fmtLow = fmt.toLowerCase();
                                        const busy   = exporting === fmtLow;
                                        return (
                                            <button
                                                key={fmt}
                                                className="statistiques-export-menu__item"
                                                onClick={() => handleExportStatistiques(fmtLow)}
                                                role="menuitem"
                                                type="button"
                                                disabled={busy}
                                            >
                                                {busy ? "…" : fmt}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Filtre (modal) ── */}
            {showFilter && (
                <>
                    <div
                        className="statistiques-filter__overlay"
                        onClick={() => setShowFilter(false)}
                        aria-hidden="true"
                    />
                    <div
                        className="statistiques-filter__panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Filtrer les statistiques"
                    >
                        <div className="statistiques-filter__header">
                            <h2 className="statistiques-filter__title">Filtrer</h2>
                            <button
                                className="statistiques-filter__close"
                                onClick={() => setShowFilter(false)}
                                aria-label="Fermer"
                                type="button"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="statistiques-filter__body">
                            <div className="statistiques-filter__field">
                                <label className="statistiques-filter__label" htmlFor="stats-date-debut">
                                    Date de début
                                </label>
                                <input
                                    id="stats-date-debut"
                                    type="date"
                                    className="app-input"
                                    value={dateDebut}
                                    onChange={e => setDateDebut(e.target.value)}
                                />
                            </div>
                            <div className="statistiques-filter__field">
                                <label className="statistiques-filter__label" htmlFor="stats-date-fin">
                                    Date de fin
                                </label>
                                <input
                                    id="stats-date-fin"
                                    type="date"
                                    className="app-input"
                                    value={dateFin}
                                    onChange={e => setDateFin(e.target.value)}
                                    min={dateDebut || undefined}
                                />
                            </div>
                        </div>
                        <div className="statistiques-filter__footer">
                            <button
                                className="app-button app-button--ghost app-button--sm"
                                onClick={clearFilter}
                                type="button"
                            >
                                Réinitialiser
                            </button>
                            <button
                                className="app-button app-button--primary app-button--sm"
                                onClick={applyFilter}
                                type="button"
                            >
                                Appliquer
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── Navigation onglets ── */}
            <nav className="stats-tabs" role="tablist" aria-label="Sections statistiques">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`stats-panel-${tab.id}`}
                        id={`stats-tab-${tab.id}`}
                        className={`stats-tabs__btn${activeTab === tab.id ? " stats-tabs__btn--active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                        type="button"
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* ── Panneaux ── */}
            <div
                id={`stats-panel-general`}
                role="tabpanel"
                aria-labelledby="stats-tab-general"
                hidden={activeTab !== "general"}
                className="stats-panel"
            >
                {loadingGeneral ? (
                    <VueGeneraleSkeleton />
                ) : errorGeneral ? (
                    <ErrorState message={errorGeneral} onRetry={retryGeneral} />
                ) : generalData ? (
                    <VueGenerale data={generalData} />
                ) : null}
            </div>

            <div
                id="stats-panel-clients"
                role="tabpanel"
                aria-labelledby="stats-tab-clients"
                hidden={activeTab !== "clients"}
                className="stats-panel"
            >
                {loadingClients ? (
                    <ClientsSkeleton />
                ) : errorClients ? (
                    <ErrorState message={errorClients} onRetry={retryClients} />
                ) : clientsData ? (
                    <VueClients data={clientsData} />
                ) : null}
            </div>

            <div
                id="stats-panel-commandes"
                role="tabpanel"
                aria-labelledby="stats-tab-commandes"
                hidden={activeTab !== "commandes"}
                className="stats-panel"
            >
                {loadingCommandes ? (
                    <CommandesSkeleton />
                ) : errorCommandes ? (
                    <ErrorState message={errorCommandes} onRetry={retryCommandes} />
                ) : commandesData ? (
                    <VueCommandes data={commandesData} />
                ) : null}
            </div>

        </section>
    );
}

// ─── Vue Générale ─────────────────────────────────────────────────────────────

function VueGenerale({ data }) {
    const { kpis, commandes_en_livraison, commandes_livrees, commandes_annulees,
            taux_livraison, produits_rupture, produits_stock_faible } = data;

    const heroKpis = [
        { label: "Clients",    value: kpis.nb_clients,                     icon: <Users size={22} />,       variant: "primary" },
        { label: "Commandes",  value: kpis.nb_commandes,                   icon: <ShoppingBag size={22} />, variant: "info"    },
        { label: "Produits",   value: kpis.nb_produits,                    icon: <Package size={22} />,     variant: "neutral" },
        { label: "CA total",   value: formatMontant(kpis.ca_total),        icon: <TrendingUp size={22} />,  variant: "success" },
    ];

    const deliveryKpis = [
        { label: "En livraison", value: commandes_en_livraison, icon: <Truck size={18} />,        variant: "warning" },
        { label: "Livrées",      value: commandes_livrees,      icon: <CheckCircle2 size={18} />, variant: "success" },
        { label: "Annulées",     value: commandes_annulees,     icon: <XCircle size={18} />,      variant: "danger"  },
    ];

    return (
        <div className="stats-general">

            {/* Hero KPIs */}
            <div className="stats-kpi-grid stats-kpi-grid--hero">
                {heroKpis.map(({ label, value, icon, variant }) => (
                    <KpiCard key={label} label={label} value={value} icon={icon} variant={variant} hero />
                ))}
            </div>

            {/* Section livraisons */}
            <div className="stats-section">
                <h2 className="stats-section__title">État des commandes</h2>
                <div className="stats-kpi-grid stats-kpi-grid--3">
                    {deliveryKpis.map(({ label, value, icon, variant }) => (
                        <KpiCard key={label} label={label} value={value} icon={icon} variant={variant} />
                    ))}
                </div>
                {taux_livraison !== undefined && (
                    <div className="stats-taux-bar">
                        <div className="stats-taux-bar__header">
                            <span className="stats-taux-bar__label">Taux de livraison</span>
                            <span className="stats-taux-bar__value">{taux_livraison}%</span>
                        </div>
                        <div className="stats-taux-bar__track">
                            <div
                                className="stats-taux-bar__fill"
                                style={{ width: `${taux_livraison}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Section stock */}
            <div className="stats-section">
                <h2 className="stats-section__title">Alertes stock</h2>
                <div className="stats-kpi-grid stats-kpi-grid--2">
                    <KpiCard
                        label="Rupture de stock"
                        value={produits_rupture}
                        icon={<XCircle size={18} />}
                        variant="danger"
                        suffix="produit"
                        pluralSuffix="produits"
                    />
                    <KpiCard
                        label="Stock faible"
                        value={produits_stock_faible}
                        icon={<AlertTriangle size={18} />}
                        variant="warning"
                        suffix="produit"
                        pluralSuffix="produits"
                    />
                </div>
            </div>
        </div>
    );
}

function VueGeneraleSkeleton() {
    return (
        <div className="stats-general">
            <div className="stats-kpi-grid stats-kpi-grid--hero">
                {[1, 2, 3, 4].map(i => <SkeletonKpi key={i} />)}
            </div>
            <div className="stats-section">
                <span className="stats-skeleton__cell stats-skeleton__cell--sm" style={{ height: 12, display: "block", marginBottom: "var(--space-4)" }} />
                <div className="stats-kpi-grid stats-kpi-grid--3">
                    {[1, 2, 3].map(i => <SkeletonKpi key={i} />)}
                </div>
            </div>
            <div className="stats-section">
                <span className="stats-skeleton__cell stats-skeleton__cell--sm" style={{ height: 12, display: "block", marginBottom: "var(--space-4)" }} />
                <div className="stats-kpi-grid stats-kpi-grid--2">
                    {[1, 2].map(i => <SkeletonKpi key={i} />)}
                </div>
            </div>
        </div>
    );
}

// ─── Vue Clients ──────────────────────────────────────────────────────────────

function VueClients({ data }) {
    const { top_clients, clients_moins_actifs, plus_gros_ca, plus_faible_ca, ca_max } = data;

    return (
        <div className="stats-clients">
            <div className="stats-two-col">
                <RankingBlock
                    title="Top clients par CA"
                    icon={<Award size={18} />}
                    items={top_clients}
                    valueKey="ca"
                    max={ca_max}
                    formatValue={v => formatMontant(v)}
                    subKey="commandes"
                    subFormat={n => `${n} commandes`}
                    variant="primary"
                    up
                />
                <RankingBlock
                    title="Clients les moins actifs"
                    icon={<TrendingDown size={18} />}
                    items={clients_moins_actifs}
                    valueKey="ca"
                    max={ca_max}
                    formatValue={v => formatMontant(v)}
                    subKey="commandes"
                    subFormat={n => `${n} commandes`}
                    variant="neutral"
                    down
                />
            </div>
        </div>
    );
}

function ClientsSkeleton() {
    return (
        <div className="stats-clients">
            <div className="stats-two-col">
                <div className="stats-block">
                    <span className="stats-skeleton__cell stats-skeleton__cell--sm" style={{ height: 12, display: "block", marginBottom: "var(--space-4)" }} />
                    <SkeletonRanking />
                </div>
                <div className="stats-block">
                    <span className="stats-skeleton__cell stats-skeleton__cell--sm" style={{ height: 12, display: "block", marginBottom: "var(--space-4)" }} />
                    <SkeletonRanking />
                </div>
            </div>
        </div>
    );
}

// ─── Vue Commandes ────────────────────────────────────────────────────────────

function VueCommandes({ data }) {
    const { plus_frequentes, moins_frequentes, plus_gros_montants, plus_faibles_montants, montant_max } = data;

    return (
        <div className="stats-commandes">
            <div className="stats-two-col">
                <RankingBlock
                    title="Produits les plus commandés"
                    icon={<TrendingUp size={18} />}
                    items={plus_frequentes}
                    valueKey="commandes"
                    max={plus_frequentes?.[0]?.commandes ?? 1}
                    formatValue={v => `${v} cmd`}
                    subKey="montant_total"
                    subFormat={v => formatMontant(v)}
                    nameKey="produit"
                    variant="primary"
                    up
                />
                <RankingBlock
                    title="Produits les moins commandés"
                    icon={<TrendingDown size={18} />}
                    items={moins_frequentes}
                    valueKey="commandes"
                    max={plus_frequentes?.[0]?.commandes ?? 1}
                    formatValue={v => `${v} cmd`}
                    subKey="montant_total"
                    subFormat={v => formatMontant(v)}
                    nameKey="produit"
                    variant="neutral"
                    down
                />
            </div>

            <div className="stats-two-col">
                <RankingBlock
                    title="Commandes les plus importantes"
                    icon={<Award size={18} />}
                    items={plus_gros_montants}
                    valueKey="montant"
                    max={montant_max ?? 1}
                    formatValue={v => formatMontant(v)}
                    subKey="client"
                    subFormat={v => v}
                    nameKey="numero"
                    variant="success"
                    up
                />
                <RankingBlock
                    title="Commandes les plus faibles"
                    icon={<ChevronDown size={18} />}
                    items={plus_faibles_montants}
                    valueKey="montant"
                    max={montant_max ?? 1}
                    formatValue={v => formatMontant(v)}
                    subKey="client"
                    subFormat={v => v}
                    nameKey="numero"
                    variant="neutral"
                    down
                />
            </div>
        </div>
    );
}

function CommandesSkeleton() {
    return (
        <div className="stats-commandes">
            {[1, 2].map(row => (
                <div key={row} className="stats-two-col">
                    <div className="stats-block">
                        <span className="stats-skeleton__cell stats-skeleton__cell--sm" style={{ height: 12, display: "block", marginBottom: "var(--space-4)" }} />
                        <SkeletonRanking />
                    </div>
                    <div className="stats-block">
                        <span className="stats-skeleton__cell stats-skeleton__cell--sm" style={{ height: 12, display: "block", marginBottom: "var(--space-4)" }} />
                        <SkeletonRanking />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Blocs génériques ─────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, variant, hero, suffix, pluralSuffix }) {
    const displayValue = typeof value === "number" && suffix
        ? `${value} ${value !== 1 ? (pluralSuffix ?? suffix) : suffix}`
        : value;

    return (
        <div className={`stats-kpi stats-kpi--${variant}${hero ? " stats-kpi--hero" : ""}`}>
            <div className={`stats-kpi__icon stats-kpi__icon--${variant}`} aria-hidden="true">
                {icon}
            </div>
            <span className="stats-kpi__label">{label}</span>
            <span className="stats-kpi__value">{displayValue}</span>
        </div>
    );
}

function RankingBlock({ title, icon, items, valueKey, max, formatValue, subKey, subFormat, nameKey = "nom", variant, up, down }) {
    if (!items || items.length === 0) return <EmptySection label={title} />;

    return (
        <div className="stats-block">
            <div className="stats-block__header">
                <div className={`stats-block__header-icon stats-block__header-icon--${variant}`}>
                    {icon}
                </div>
                <h2 className="stats-block__title">{title}</h2>
                {up   && <ChevronUp   size={16} className="stats-block__trend stats-block__trend--up"   aria-hidden="true" />}
                {down && <ChevronDown size={16} className="stats-block__trend stats-block__trend--down" aria-hidden="true" />}
            </div>

            <div className="stats-ranking">
                {items.map((item, i) => {
                    const val      = item[valueKey] ?? 0;
                    const fillPct  = max > 0 ? Math.round((val / max) * 100) : 0;
                    const subVal   = item[subKey];

                    return (
                        <div key={item.id ?? item.rang ?? i} className="stats-ranking__row">
                            <span className={`stats-ranking__pos stats-ranking__pos--${i < 3 ? "medal" + (i + 1) : "plain"}`}>
                                {item.rang ?? i + 1}
                            </span>
                            <div className="stats-ranking__info">
                                <span className="stats-ranking__name">{item[nameKey] ?? "—"}</span>
                                {subVal !== undefined && (
                                    <span className="stats-ranking__sub">{subFormat(subVal)}</span>
                                )}
                                <div className="stats-ranking__bar-wrap">
                                    <div
                                        className={`stats-ranking__bar stats-ranking__bar--${variant}`}
                                        style={{ width: `${fillPct}%` }}
                                    />
                                </div>
                            </div>
                            <span className="stats-ranking__value">{formatValue(val)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Statistiques;
