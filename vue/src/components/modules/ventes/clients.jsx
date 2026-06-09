import { useState, useEffect, useRef, useCallback } from "react";
import {
    Users, Search, X, Download, ChevronRight,
    Phone, Mail, Calendar, ShoppingBag, TrendingUp,
    AlertCircle, SlidersHorizontal, ReceiptText
} from "lucide-react";
import { getBadgeConfig, formatMontant, formatDate, fetchVentesClients, fetchVentesClientById } from "../../../services/ventes.js";
import "../../../assets/styles/components/modules/ventes/clients.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(prenom, nom) {
    const p = (prenom?.[0] ?? "").toUpperCase();
    const n = (nom?.[0] ?? "").toUpperCase();
    return `${p}${n}`;
}

const AVATAR_COLORS = [
    "#F39C12", "#27AE60", "#2980B9", "#8E44AD",
    "#E74C3C", "#16A085", "#D35400", "#2C3E50",
];

function getAvatarColor(index) {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="clients-card clients-card--skeleton" aria-hidden="true">
            <div className="clients-card__avatar clients-skeleton__avatar" />
            <div className="clients-card__body">
                <span className="clients-skeleton__cell clients-skeleton__cell--lg" style={{ height: 14 }} />
                <span className="clients-skeleton__cell clients-skeleton__cell--md" style={{ height: 11, marginTop: 6 }} />
                <div className="clients-card__stats" style={{ marginTop: 8 }}>
                    <span className="clients-skeleton__badge" />
                    <span className="clients-skeleton__badge" />
                </div>
            </div>
            <div className="clients-card__chevron" style={{ color: "var(--color-border)" }}>
                <ChevronRight size={18} />
            </div>
        </div>
    );
}

function EmptyState({ icon, title, desc, action }) {
    return (
        <div className="clients-empty" role="status">
            <div className="clients-empty__icon" aria-hidden="true">{icon}</div>
            <h3 className="clients-empty__title">{title}</h3>
            <p className="clients-empty__desc">{desc}</p>
            {action}
        </div>
    );
}

function OrderBadge({ statut }) {
    const cfg = getBadgeConfig(statut);
    return <span className={`ventes-badge ventes-badge--${cfg.variant}`}>{cfg.label}</span>;
}

// ─── Composant principal ──────────────────────────────────────────────────────

function Clients() {
    // ── Liste ──────────────────────────────────────────────────────────────────
    const [clients,    setClients]    = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // ── Détail ─────────────────────────────────────────────────────────────────
    const [selectedClient, setSelectedClient] = useState(null);
    const [detailData,     setDetailData]     = useState(null);
    const [loadingDetail,  setLoadingDetail]  = useState(false);
    const [detailError,    setDetailError]    = useState(null);

    // ── Recherche ──────────────────────────────────────────────────────────────
    const [searchQuery,    setSearchQuery]    = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // ── Préchargement hover (desktop) ──────────────────────────────────────────
    const prefetchTimerRef = useRef(null);

    // ── Fetch liste ────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchVentesClients()
            .then(json => setClients(json.data ?? []))
            .catch(err => setFetchError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // ── Debounce 300ms ─────────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // ── Ouverture détail ───────────────────────────────────────────────────────
    const openDetail = useCallback((client) => {
        setSelectedClient(client);
        setDetailData(null);
        setDetailError(null);
        setLoadingDetail(true);
        fetchVentesClientById(client.id)
            .then(data => setDetailData(data))
            .catch(err => setDetailError(err.message))
            .finally(() => setLoadingDetail(false));
    }, []);

    const closeDetail = useCallback(() => {
        setSelectedClient(null);
        setDetailData(null);
        setDetailError(null);
    }, []);

    // ── Préchargement au hover (desktop) ───────────────────────────────────────
    const handleMouseEnter = useCallback((client) => {
        prefetchTimerRef.current = setTimeout(() => {
            fetchVentesClientById(client.id).catch(() => {});
        }, 150);
    }, []);

    const handleMouseLeave = useCallback(() => {
        clearTimeout(prefetchTimerRef.current);
    }, []);

    // ── Filtrage ───────────────────────────────────────────────────────────────
    const filtered = clients.filter(c => {
        const q = debouncedQuery.toLowerCase();
        if (!q) return true;
        const full = `${c.prenom} ${c.nom}`.toLowerCase();
        return (
            full.includes(q) ||
            (c.telephone ?? "").includes(q) ||
            (c.email ?? "").toLowerCase().includes(q)
        );
    });

    // ── KPIs ───────────────────────────────────────────────────────────────────
    const kpis = [
        {
            label: "Total clients",
            value: clients.length,
            icon: <Users size={20} />,
            variant: "primary",
        },
        {
            label: "Commandes totales",
            value: clients.reduce((s, c) => s + (c.commandes ?? 0), 0),
            icon: <ShoppingBag size={20} />,
            variant: "info",
        },
        {
            label: "CA généré",
            value: formatMontant(clients.reduce((s, c) => s + (c.ca_total ?? 0), 0)),
            icon: <TrendingUp size={20} />,
            variant: "success",
        },
    ];

    return (
        <section className="clients-root" aria-label="Gestion des clients">

            {/* ── Header ── */}
            <header className="clients-header">
                <div className="clients-header__left">
                    <h1 className="clients-header__title">Clients</h1>
                    <p className="clients-header__subtitle">
                        Retrouvez, consultez et analysez vos clients en un clin d'œil.
                    </p>
                </div>
                <div className="clients-header__actions">
                    <button
                        className="app-button app-button--ghost app-button--sm"
                        onClick={() => window.alert("Export CSV")}
                        type="button"
                        aria-label="Exporter"
                    >
                        <Download size={16} aria-hidden="true" />
                        Exporter
                    </button>
                </div>
            </header>

            {/* ── KPIs ── */}
            {!loading && !fetchError && (
                <div className="clients-kpis" role="region" aria-label="Indicateurs">
                    {kpis.map(({ label, value, icon, variant }) => (
                        <div key={label} className={`clients-kpi clients-kpi--${variant}`}>
                            <div className={`clients-kpi__icon clients-kpi__icon--${variant}`} aria-hidden="true">
                                {icon}
                            </div>
                            <div className="clients-kpi__body">
                                <span className="clients-kpi__value">{value}</span>
                                <span className="clients-kpi__label">{label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Recherche ── */}
            <div className="clients-search-wrap">
                <div className="clients-search">
                    <Search size={16} className="clients-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="app-input clients-search__input"
                        placeholder="Rechercher par nom, téléphone ou email…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        aria-label="Rechercher un client"
                        disabled={loading}
                    />
                    {searchQuery && (
                        <button
                            className="clients-search__clear"
                            onClick={() => setSearchQuery("")}
                            type="button"
                            aria-label="Effacer la recherche"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                {!loading && !fetchError && (
                    <span className="clients-count">
                        {filtered.length} client{filtered.length !== 1 ? "s" : ""}
                        {debouncedQuery ? ` trouvé${filtered.length !== 1 ? "s" : ""}` : ""}
                    </span>
                )}
            </div>

            {/* ── Contenu ── */}
            {loading ? (
                <div className="clients-list" aria-label="Chargement…">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : fetchError ? (
                <div className="clients-error-state" role="alert">
                    <AlertCircle size={36} />
                    <p className="clients-error-state__text">
                        Impossible de charger les clients.<br />
                        <em>{fetchError}</em>
                    </p>
                    <button
                        className="app-button app-button--primary app-button--sm"
                        onClick={() => {
                            setFetchError(null);
                            setLoading(true);
                            fetchVentesClients()
                                .then(j => setClients(j.data ?? []))
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
                    icon={<Users size={36} />}
                    title="Aucun client trouvé"
                    desc={
                        debouncedQuery
                            ? `Aucun client ne correspond à « ${debouncedQuery} ».`
                            : "Aucun client enregistré pour l'instant."
                    }
                    action={
                        debouncedQuery && (
                            <button
                                className="app-button app-button--ghost app-button--sm"
                                onClick={() => setSearchQuery("")}
                                type="button"
                            >
                                Effacer la recherche
                            </button>
                        )
                    }
                />
            ) : (
                <div className="clients-list" role="list" aria-label="Liste des clients">
                    {filtered.map((client, index) => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            index={index}
                            onClick={() => openDetail(client)}
                            onMouseEnter={() => handleMouseEnter(client)}
                            onMouseLeave={handleMouseLeave}
                        />
                    ))}
                </div>
            )}

            {/* ── Drawer détail ── */}
            {selectedClient && (
                <>
                    <div
                        className="clients-drawer__overlay"
                        onClick={closeDetail}
                        aria-hidden="true"
                    />
                    <aside
                        className="clients-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Détail de ${selectedClient.prenom} ${selectedClient.nom}`}
                    >
                        <div className="clients-drawer__handle" aria-hidden="true">
                            <span className="clients-drawer__handle-bar" />
                        </div>

                        <div className="clients-drawer__header">
                            <div className="clients-drawer__header-left">
                                <div
                                    className="clients-drawer__avatar"
                                    style={{
                                        backgroundColor: getAvatarColor(
                                            clients.findIndex(c => c.id === selectedClient.id)
                                        ),
                                    }}
                                    aria-hidden="true"
                                >
                                    {getInitials(selectedClient.prenom, selectedClient.nom)}
                                </div>
                                <div>
                                    <h2 className="clients-drawer__name">
                                        {selectedClient.prenom} {selectedClient.nom}
                                    </h2>
                                    <p className="clients-drawer__phone">{selectedClient.telephone}</p>
                                </div>
                            </div>
                            <button
                                className="clients-drawer__close"
                                onClick={closeDetail}
                                type="button"
                                aria-label="Fermer"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="clients-drawer__body">
                            {loadingDetail ? (
                                <DetailSkeleton />
                            ) : detailError ? (
                                <DetailFallback client={selectedClient} />
                            ) : detailData ? (
                                <DetailContent data={detailData} />
                            ) : null}
                        </div>
                    </aside>
                </>
            )}

        </section>
    );
}

// ─── Carte client ─────────────────────────────────────────────────────────────

function ClientCard({ client, index, onClick, onMouseEnter, onMouseLeave }) {
    return (
        <article
            className="clients-card"
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && onClick()}
            aria-label={`Ouvrir le dossier de ${client.prenom} ${client.nom}`}
        >
            <div
                className="clients-card__avatar"
                style={{ backgroundColor: getAvatarColor(index) }}
                aria-hidden="true"
            >
                {getInitials(client.prenom, client.nom)}
            </div>

            <div className="clients-card__body">
                <p className="clients-card__name">{client.prenom} {client.nom}</p>
                <p className="clients-card__phone">{client.telephone}</p>
                <div className="clients-card__stats">
                    <span className="clients-card__stat">
                        <ShoppingBag size={12} aria-hidden="true" />
                        {client.commandes ?? 0} commande{(client.commandes ?? 0) !== 1 ? "s" : ""}
                    </span>
                    <span className="clients-card__stat clients-card__stat--ca">
                        <TrendingUp size={12} aria-hidden="true" />
                        {formatMontant(client.ca_total ?? 0)}
                    </span>
                </div>
            </div>

            <div className="clients-card__chevron" aria-hidden="true">
                <ChevronRight size={18} />
            </div>
        </article>
    );
}

// ─── Skeleton détail ──────────────────────────────────────────────────────────

function DetailSkeleton() {
    return (
        <div className="clients-detail__skeleton" aria-hidden="true">
            {/* Bloc profil */}
            <div className="clients-detail__block">
                <span className="clients-skeleton__cell clients-skeleton__cell--sm" style={{ height: 10 }} />
                {[120, 90, 140, 100].map((w, i) => (
                    <div key={i} className="clients-detail__row" style={{ borderBottom: "1px solid var(--color-border)", padding: "var(--space-3) 0" }}>
                        <span className="clients-skeleton__cell" style={{ width: 80 }} />
                        <span className="clients-skeleton__cell" style={{ width: w }} />
                    </div>
                ))}
            </div>

            {/* Bloc KPIs */}
            <div className="clients-resume__grid">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="clients-resume__card" style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "var(--space-4)" }}>
                        <span className="clients-skeleton__cell clients-skeleton__cell--sm" style={{ height: 10, marginBottom: 8 }} />
                        <span className="clients-skeleton__cell clients-skeleton__cell--md" style={{ height: 20 }} />
                    </div>
                ))}
            </div>

            {/* Bloc commandes */}
            <div className="clients-detail__block">
                <span className="clients-skeleton__cell clients-skeleton__cell--sm" style={{ height: 10 }} />
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                        <span className="clients-skeleton__cell" style={{ width: 130 }} />
                        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                            <span className="clients-skeleton__badge" />
                            <span className="clients-skeleton__cell" style={{ width: 70 }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Contenu détail complet ───────────────────────────────────────────────────

function DetailContent({ data }) {
    const { client, resume, dernieres_commandes } = data;

    return (
        <>
            {/* Profil */}
            <div className="clients-detail__block">
                <span className="clients-detail__block-label">Profil</span>
                {[
                    { icon: <Mail size={14} />,     label: "Email",       value: client.email     ?? "—" },
                    { icon: <Phone size={14} />,    label: "Téléphone",   value: client.telephone ?? "—" },
                    { icon: <Calendar size={14} />, label: "Client depuis", value: formatDate(client.date_creation) },
                ].map(({ icon, label, value }) => (
                    <div key={label} className="clients-detail__row">
                        <span className="clients-detail__key">
                            {icon}
                            {label}
                        </span>
                        <span className="clients-detail__val">{value}</span>
                    </div>
                ))}
            </div>

            {/* Résumé commercial */}
            <div className="clients-resume__grid" role="region" aria-label="Indicateurs commerciaux">
                {[
                    { label: "Commandes",          value: resume.total_commandes,                  variant: "primary" },
                    { label: "CA total",           value: formatMontant(resume.ca_total),          variant: "success" },
                    { label: "Panier moyen",       value: formatMontant(resume.commande_moyenne),  variant: "info"    },
                    { label: "Dernière commande",  value: formatDate(resume.derniere_commande),    variant: "neutral" },
                ].map(({ label, value, variant }) => (
                    <div key={label} className={`clients-resume__card clients-resume__card--${variant}`}>
                        <span className="clients-resume__label">{label}</span>
                        <span className="clients-resume__value">{value}</span>
                    </div>
                ))}
            </div>

            {/* Dernières commandes */}
            <div className="clients-detail__block">
                <span className="clients-detail__block-label">
                    <ReceiptText size={14} aria-hidden="true" />
                    Dernières commandes
                </span>

                {(dernieres_commandes ?? []).length === 0 ? (
                    <p className="clients-detail__empty">Aucune commande enregistrée.</p>
                ) : (
                    <div className="clients-orders__list">
                        {(dernieres_commandes ?? []).map(cmd => {
                            const cfg = getBadgeConfig(cmd.statut);
                            return (
                                <div key={cmd.id} className="clients-order-row">
                                    <div className="clients-order-row__left">
                                        <span className="clients-order-row__num">{cmd.numero}</span>
                                        <span className="clients-order-row__date">{formatDate(cmd.date)}</span>
                                    </div>
                                    <div className="clients-order-row__right">
                                        <span className={`ventes-badge ventes-badge--${cfg.variant}`}>{cfg.label}</span>
                                        <span className="clients-order-row__amount">{formatMontant(cmd.montant)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Fallback si JSON détail absent ──────────────────────────────────────────

function DetailFallback({ client }) {
    return (
        <div className="clients-detail__block">
            <span className="clients-detail__block-label">Profil</span>
            {[
                { icon: <Phone size={14} />,    label: "Téléphone", value: client.telephone ?? "—" },
                { icon: <ShoppingBag size={14} />, label: "Commandes", value: `${client.commandes ?? 0}` },
                { icon: <TrendingUp size={14} />,  label: "CA total",  value: formatMontant(client.ca_total ?? 0) },
            ].map(({ icon, label, value }) => (
                <div key={label} className="clients-detail__row">
                    <span className="clients-detail__key">
                        {icon}
                        {label}
                    </span>
                    <span className="clients-detail__val">{value}</span>
                </div>
            ))}
        </div>
    );
}

export default Clients;
