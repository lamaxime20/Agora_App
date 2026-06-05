import { useState, useEffect, useRef } from "react";
import {
    ShoppingCart, Search, X, Plus, AlertTriangle,
    ChevronLeft, ChevronRight, Download, User, Package,
    XCircle, CheckCircle,
} from "lucide-react";
import { getBadgeConfig, formatMontant, formatDate } from "../../../services/ventes.js";
import "../../../assets/styles/components/modules/ventes/commandes.css";

const INITIAL_CLIENTS = [
    { id: 1, nom: "Dupont",  prenom: "Jean",   email: "jean.dupont@email.com",    telephone: "0601020304" },
    { id: 2, nom: "Martin",  prenom: "Sophie",  email: "sophie.martin@email.com",  telephone: "0605060708" },
];

const INITIAL_PRODUCTS = [
    { id: 1, nom: "Produit Alpha", prix_unitaire: 150, reduction: 15, stock: 10 },
    { id: 2, nom: "Produit Beta",  prix_unitaire: 80,  reduction: 0,  stock: 2  },
    { id: 3, nom: "Produit Gamma", prix_unitaire: 200, reduction: 50, stock: 5  },
];

const INITIAL_ORDERS = [
    { id: 1, client: "Dupont Jean",   montant: 135, statut: "reçu",   adresse: "12 Rue de Paris",    date: "2026-06-15", notes: "Livraison le matin", paiements: [] },
    { id: 2, client: "Martin Sophie", montant: 80,  statut: "validé", adresse: "45 Avenue de Lyon",  date: "2026-06-18", notes: "", paiements: [
        { date: "2026-06-05", montant: 80, mode: "Carte Bancaire", reference: "TX-99823", user: "Finance_A" }
    ] },
];

const PER_PAGE_OPTIONS = [20, 50, 100];

// ─── Composant racine ──────────────────────────────────────────────────────────

function Commandes() {
    const [clients,  setClients]  = useState(INITIAL_CLIENTS);
    const [products]              = useState(INITIAL_PRODUCTS);
    const [orders,   setOrders]   = useState(INITIAL_ORDERS);

    // navigation
    const [view, setView]                     = useState("list"); // "list" | "new"
    const [selectedOrder, setSelectedOrder]   = useState(null);
    const [orderToCancel, setOrderToCancel]   = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // formulaire nouvelle commande
    const [newOrder, setNewOrder] = useState({ client: "", items: [], adresse: "", date: "", notes: "" });
    const [showClientPane,  setShowClientPane]  = useState(false);
    const [showProductPane, setShowProductPane] = useState(false);
    const [newClientForm, setNewClientForm]     = useState({ nom: "", prenom: "", email: "", telephone: "" });
    const [showAddClientForm, setShowAddClientForm] = useState(false);
    const [formError, setFormError]             = useState("");

    // liste
    const [searchQuery,    setSearchQuery]    = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [productSearch,  setProductSearch]  = useState("");
    const [clientSearch,   setClientSearch]   = useState("");
    const [statusFilter,   setStatusFilter]   = useState("tous");
    const [cancelReason,   setCancelReason]   = useState("");
    const [perPage,        setPerPage]        = useState(20);
    const [page,           setPage]           = useState(1);

    // debounce 300ms
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // reset page quand filtres changent
    useEffect(() => { setPage(1); }, [debouncedQuery, statusFilter]);

    // ─── Calculs ────────────────────────────────────────────────────────────

    const calcTotal = (items) =>
        items.reduce((acc, it) => acc + (it.quantite * it.prix_unitaire - it.reduction), 0);

    const filteredOrders = orders.filter((o) => {
        const q = debouncedQuery.toLowerCase();
        const matchSearch =
            !q ||
            o.client.toLowerCase().includes(q) ||
            String(o.id).includes(q) ||
            o.statut.toLowerCase().includes(q);
        const matchStatus = statusFilter === "tous" || o.statut === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages     = Math.ceil(filteredOrders.length / perPage);
    const paginatedOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);

    // KPI
    const kpis = [
        {
            label: "Total commandes",
            value: orders.length,
            icon: ShoppingCart,
            variant: "primary",
        },
        {
            label: "En cours",
            value: orders.filter((o) => o.statut === "reçu" || o.statut === "validé").length,
            icon: CheckCircle,
            variant: "info",
        },
        {
            label: "Livrées",
            value: orders.filter((o) => o.statut === "livré").length,
            icon: Package,
            variant: "success",
        },
        {
            label: "Annulées",
            value: orders.filter((o) => o.statut === "annulé").length,
            icon: XCircle,
            variant: "warning",
        },
    ];

    // ─── Actions ─────────────────────────────────────────────────────────────

    const handleAddProduct = (product) => {
        if (newOrder.items.some((i) => i.id === product.id)) return;
        setNewOrder((prev) => ({ ...prev, items: [...prev.items, { ...product, quantite: 1 }] }));
    };

    const handleUpdateQty = (id, delta) => {
        setNewOrder((prev) => ({
            ...prev,
            items: prev.items
                .map((it) => it.id === id ? { ...it, quantite: it.quantite + delta } : it)
                .filter((it) => it.quantite > 0),
        }));
    };

    const handleAddClientSubmit = () => {
        if (!newClientForm.nom || !newClientForm.email) {
            setFormError("Le nom et l'email sont obligatoires.");
            return;
        }
        if (clients.some((c) => c.email.toLowerCase() === newClientForm.email.toLowerCase())) {
            setFormError("Un client avec cet email existe déjà.");
            return;
        }
        const created = { id: clients.length + 1, ...newClientForm };
        setClients((prev) => [...prev, created]);
        setNewOrder((prev) => ({ ...prev, client: `${created.nom} ${created.prenom}` }));
        setNewClientForm({ nom: "", prenom: "", email: "", telephone: "" });
        setShowAddClientForm(false);
        setShowClientPane(false);
        setFormError("");
    };

    const handleSubmitOrder = () => {
        if (!newOrder.client) { setFormError("Veuillez sélectionner un client."); return; }
        if (!newOrder.items.length) { setFormError("Veuillez ajouter au moins un produit."); return; }
        for (const it of newOrder.items) {
            if (it.quantite > it.stock) {
                setFormError(`Stock insuffisant pour « ${it.nom} ».`);
                return;
            }
        }
        const saved = {
            id: orders.length + 1,
            client: newOrder.client,
            montant: calcTotal(newOrder.items),
            statut: "reçu",
            adresse: newOrder.adresse,
            date: newOrder.date,
            notes: newOrder.notes,
            paiements: [],
        };
        setOrders((prev) => [saved, ...prev]);
        setNewOrder({ client: "", items: [], adresse: "", date: "", notes: "" });
        setFormError("");
        setView("list");
    };

    const handleCancelConfirm = () => {
        if (!cancelReason.trim()) { alert("Veuillez saisir un motif d'annulation."); return; }
        setOrders((prev) =>
            prev.map((o) => o.id === orderToCancel.id ? { ...o, statut: "annulé" } : o)
        );
        if (selectedOrder?.id === orderToCancel.id) {
            setSelectedOrder((prev) => ({ ...prev, statut: "annulé" }));
        }
        setShowCancelModal(false);
        setOrderToCancel(null);
        setCancelReason("");
    };

    const openCancel = (order, e) => {
        e?.stopPropagation();
        setOrderToCancel(order);
        setShowCancelModal(true);
    };

    const resetForm = () => {
        setView("list");
        setNewOrder({ client: "", items: [], adresse: "", date: "", notes: "" });
        setFormError("");
        setShowClientPane(false);
        setShowProductPane(false);
    };

    const canCancel = (s) => ["reçu", "validé", "en cours de livraison"].includes(s);

    // ─── Rendu ───────────────────────────────────────────────────────────────

    return (
        <section className="commandes-root" aria-label="Gestion des commandes">

            {/* Header */}
            <header className="commandes-header">
                <div className="commandes-header__left">
                    <h1 className="commandes-header__title">Commandes</h1>
                    <p className="commandes-header__subtitle">
                        Créez, suivez et gérez toutes vos commandes clients.
                    </p>
                </div>
                <button
                    className="app-button app-button--primary"
                    onClick={() => { setView("new"); setFormError(""); }}
                    type="button"
                >
                    <Plus size={18} aria-hidden="true" />
                    Nouvelle commande
                </button>
            </header>

            {/* KPIs */}
            <div className="commandes-kpis" role="region" aria-label="Indicateurs">
                {kpis.map(({ label, value, icon: Icon, variant }) => (
                    <div key={label} className="commandes-kpi">
                        <div className={`commandes-kpi__icon commandes-kpi__icon--${variant}`}>
                            <Icon size={22} aria-hidden="true" />
                        </div>
                        <div className="commandes-kpi__body">
                            <span className="commandes-kpi__value">{value}</span>
                            <span className="commandes-kpi__label">{label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Barre d'outils */}
            <div className="commandes-toolbar">
                <div className="commandes-toolbar__row">
                    <div className="commandes-search">
                        <Search size={16} className="commandes-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input commandes-search__input"
                            placeholder="Rechercher par client, numéro ou statut…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Rechercher une commande"
                        />
                    </div>
                    <select
                        className="commandes-filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="Filtrer par statut"
                    >
                        <option value="tous">Tous les statuts</option>
                        <option value="reçu">Reçu</option>
                        <option value="validé">Validé</option>
                        <option value="en cours de livraison">En livraison</option>
                        <option value="livré">Livré</option>
                        <option value="annulé">Annulé</option>
                    </select>
                    <select
                        className="commandes-perpage-select"
                        value={perPage}
                        onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                        aria-label="Lignes par page"
                    >
                        {PER_PAGE_OPTIONS.map((n) => (
                            <option key={n} value={n}>{n} / page</option>
                        ))}
                    </select>
                    <div className="commandes-export-group">
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => alert("Export CSV")}
                            type="button"
                        >
                            <Download size={16} aria-hidden="true" />
                            CSV
                        </button>
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => alert("Export PDF")}
                            type="button"
                        >
                            <Download size={16} aria-hidden="true" />
                            PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste */}
            {filteredOrders.length === 0 ? (
                <EmptyState
                    icon={<ShoppingCart size={36} />}
                    title="Aucune commande trouvée"
                    desc={debouncedQuery || statusFilter !== "tous"
                        ? "Essayez de modifier vos filtres."
                        : "Créez votre première commande en cliquant sur « Nouvelle commande »."
                    }
                />
            ) : (
                <>
                    {/* Desktop : tableau */}
                    <div className="commandes-tableWrap" role="region" aria-label="Liste des commandes">
                        <table className="commandes-table" aria-label="Commandes">
                            <thead className="commandes-table__head">
                                <tr>
                                    <th scope="col">N°</th>
                                    <th scope="col">Client</th>
                                    <th scope="col">Montant</th>
                                    <th scope="col">Statut</th>
                                    <th scope="col">Date</th>
                                    <th scope="col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedOrders.map((order) => {
                                    const badge = getBadgeConfig(order.statut);
                                    return (
                                        <tr
                                            key={order.id}
                                            className="commandes-table__row"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <td className="commandes-table__id">#{order.id}</td>
                                            <td className="commandes-table__client">{order.client}</td>
                                            <td className="commandes-table__amount">{formatMontant(order.montant)}</td>
                                            <td>
                                                <span className={`ventes-badge ventes-badge--${badge.variant}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="commandes-table__date">{formatDate(order.date)}</td>
                                            <td className="commandes-table__actions">
                                                {canCancel(order.statut) && (
                                                    <button
                                                        className="commandes-table__cancel"
                                                        onClick={(e) => openCancel(order, e)}
                                                        type="button"
                                                    >
                                                        <X size={12} aria-hidden="true" />
                                                        Annuler
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile : cartes */}
                    <div className="commandes-cards" aria-label="Commandes">
                        {paginatedOrders.map((order) => {
                            const badge = getBadgeConfig(order.statut);
                            return (
                                <article
                                    key={order.id}
                                    className="commandes-card"
                                    onClick={() => setSelectedOrder(order)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Commande #${order.id} — ${order.client}`}
                                    onKeyDown={(e) => e.key === "Enter" && setSelectedOrder(order)}
                                >
                                    <div className="commandes-card__top">
                                        <span className="commandes-card__id">#{order.id}</span>
                                        <span className={`ventes-badge ventes-badge--${badge.variant}`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    <p className="commandes-card__client">{order.client}</p>
                                    <div className="commandes-card__meta">
                                        <span className="commandes-card__amount">{formatMontant(order.montant)}</span>
                                        <span className="commandes-card__date">{formatDate(order.date)}</span>
                                    </div>
                                    {canCancel(order.statut) && (
                                        <div className="commandes-card__footer">
                                            <button
                                                className="commandes-table__cancel"
                                                onClick={(e) => openCancel(order, e)}
                                                type="button"
                                            >
                                                <X size={12} aria-hidden="true" />
                                                Annuler la commande
                                            </button>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="commandes-pagination">
                            <span className="commandes-pagination__info">
                                {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredOrders.length)} sur {filteredOrders.length}
                            </span>
                            <div className="commandes-pagination__controls">
                                <button
                                    className="commandes-pagination__btn"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    aria-label="Page précédente"
                                    type="button"
                                >
                                    <ChevronLeft size={16} aria-hidden="true" />
                                </button>
                                <span className="commandes-pagination__page">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    className="commandes-pagination__btn"
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

            {/* ── Drawer détail commande ── */}
            {selectedOrder && (
                <>
                    <div
                        className="commandes-drawer__overlay"
                        onClick={() => setSelectedOrder(null)}
                        aria-hidden="true"
                    />
                    <aside className="commandes-drawer" aria-label={`Détail commande #${selectedOrder.id}`}>
                        <div className="commandes-drawer__handle" aria-hidden="true">
                            <span className="commandes-drawer__handle-bar" />
                        </div>
                        <div className="commandes-drawer__header">
                            <h2 className="commandes-drawer__title">Commande #{selectedOrder.id}</h2>
                            <button
                                className="commandes-drawer__close"
                                onClick={() => setSelectedOrder(null)}
                                aria-label="Fermer"
                                type="button"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="commandes-drawer__body">
                            {/* Infos générales */}
                            <div className="commandes-detail__block">
                                <span className="commandes-detail__block-label">Informations</span>
                                <div className="commandes-detail__row">
                                    <span className="commandes-detail__key">Client</span>
                                    <span className="commandes-detail__val">{selectedOrder.client}</span>
                                </div>
                                <div className="commandes-detail__row">
                                    <span className="commandes-detail__key">Statut</span>
                                    <span className="commandes-detail__val">
                                        {(() => { const b = getBadgeConfig(selectedOrder.statut); return <span className={`ventes-badge ventes-badge--${b.variant}`}>{b.label}</span>; })()}
                                    </span>
                                </div>
                                <div className="commandes-detail__row">
                                    <span className="commandes-detail__key">Montant</span>
                                    <span className="commandes-detail__val">{formatMontant(selectedOrder.montant)}</span>
                                </div>
                                <div className="commandes-detail__row">
                                    <span className="commandes-detail__key">Date livraison</span>
                                    <span className="commandes-detail__val">{formatDate(selectedOrder.date) || "—"}</span>
                                </div>
                                <div className="commandes-detail__row">
                                    <span className="commandes-detail__key">Adresse</span>
                                    <span className="commandes-detail__val">{selectedOrder.adresse || "—"}</span>
                                </div>
                                {selectedOrder.notes && (
                                    <div className="commandes-detail__row">
                                        <span className="commandes-detail__key">Notes</span>
                                        <span className="commandes-detail__val">{selectedOrder.notes}</span>
                                    </div>
                                )}
                            </div>

                            {/* Paiements */}
                            <div className="commandes-detail__block">
                                <span className="commandes-detail__block-label">Paiements</span>
                                {selectedOrder.paiements?.length ? (
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="commandes-payments__table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Montant</th>
                                                    <th>Mode</th>
                                                    <th>Réf.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.paiements.map((p, i) => (
                                                    <tr key={i}>
                                                        <td>{formatDate(p.date)}</td>
                                                        <td>{formatMontant(p.montant)}</td>
                                                        <td>{p.mode}</td>
                                                        <td>{p.reference}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="commandes-payments__empty">
                                        Aucun paiement enregistré. Les encaissements s'effectuent au pôle Finance.
                                    </p>
                                )}
                            </div>
                        </div>
                        {canCancel(selectedOrder.statut) && (
                            <div className="commandes-drawer__footer">
                                <button
                                    className="app-button app-button--ghost"
                                    style={{ color: "var(--color-error)", borderColor: "rgba(231,76,60,.3)", width: "100%" }}
                                    onClick={() => openCancel(selectedOrder)}
                                    type="button"
                                >
                                    <X size={16} aria-hidden="true" />
                                    Annuler cette commande
                                </button>
                            </div>
                        )}
                    </aside>
                </>
            )}

            {/* ── Panneau nouvelle commande ── */}
            {view === "new" && (
                <div className="commandes-form__overlay" role="dialog" aria-modal="true" aria-label="Nouvelle commande">
                    <div className="commandes-form__panel">
                        <div className="commandes-form__header">
                            <h2 className="commandes-form__title">Nouvelle commande</h2>
                            <button className="commandes-form__close" onClick={resetForm} type="button" aria-label="Fermer">
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="commandes-form__body">
                            {formError && (
                                <div className="commandes-error" role="alert">
                                    <AlertTriangle size={16} aria-hidden="true" />
                                    {formError}
                                </div>
                            )}

                            {/* Client */}
                            <div className="commandes-form__field">
                                <label className="commandes-form__label">Client</label>
                                <button
                                    className={`commandes-form__selector${newOrder.client ? " commandes-form__selector--active" : ""}`}
                                    onClick={() => { setShowClientPane(true); setFormError(""); }}
                                    type="button"
                                >
                                    <User size={16} aria-hidden="true" style={{ color: "var(--color-text-light)", flexShrink: 0 }} />
                                    <span className={`commandes-form__selector__text${!newOrder.client ? " commandes-form__selector__text--placeholder" : ""}`}>
                                        {newOrder.client || "Sélectionner un client"}
                                    </span>
                                    <ChevronRight size={16} aria-hidden="true" style={{ color: "var(--color-text-light)" }} />
                                </button>
                            </div>

                            {/* Produits */}
                            <div className="commandes-form__field">
                                <label className="commandes-form__label">Produits</label>
                                <button
                                    className={`commandes-form__selector${newOrder.items.length ? " commandes-form__selector--active" : ""}`}
                                    onClick={() => setShowProductPane(true)}
                                    type="button"
                                >
                                    <Package size={16} aria-hidden="true" style={{ color: "var(--color-text-light)", flexShrink: 0 }} />
                                    <span className={`commandes-form__selector__text${!newOrder.items.length ? " commandes-form__selector__text--placeholder" : ""}`}>
                                        {newOrder.items.length
                                            ? `${newOrder.items.length} produit${newOrder.items.length > 1 ? "s" : ""} sélectionné${newOrder.items.length > 1 ? "s" : ""}`
                                            : "Ouvrir le catalogue"
                                        }
                                    </span>
                                    <ChevronRight size={16} aria-hidden="true" style={{ color: "var(--color-text-light)" }} />
                                </button>
                            </div>

                            {/* Adresse */}
                            <div className="commandes-form__field">
                                <label className="commandes-form__label" htmlFor="cmd-adresse">Adresse de livraison</label>
                                <input
                                    id="cmd-adresse"
                                    type="text"
                                    className="app-input"
                                    placeholder="Ex : 12 Rue de Paris, Yaoundé"
                                    value={newOrder.adresse}
                                    onChange={(e) => setNewOrder((p) => ({ ...p, adresse: e.target.value }))}
                                />
                            </div>

                            {/* Date */}
                            <div className="commandes-form__field">
                                <label className="commandes-form__label" htmlFor="cmd-date">Date de livraison souhaitée</label>
                                <input
                                    id="cmd-date"
                                    type="date"
                                    className="app-input"
                                    value={newOrder.date}
                                    onChange={(e) => setNewOrder((p) => ({ ...p, date: e.target.value }))}
                                />
                            </div>

                            {/* Notes */}
                            <div className="commandes-form__field">
                                <label className="commandes-form__label" htmlFor="cmd-notes">Notes (optionnel)</label>
                                <textarea
                                    id="cmd-notes"
                                    className="app-input"
                                    rows={3}
                                    placeholder="Instructions particulières pour la livraison…"
                                    value={newOrder.notes}
                                    onChange={(e) => setNewOrder((p) => ({ ...p, notes: e.target.value }))}
                                    style={{ resize: "vertical", lineHeight: "var(--line-height-relaxed)" }}
                                />
                            </div>

                            {/* Total */}
                            {newOrder.items.length > 0 && (
                                <div className="commandes-form__total">
                                    <span className="commandes-form__total-label">Total calculé</span>
                                    <span className="commandes-form__total-value">{formatMontant(calcTotal(newOrder.items))}</span>
                                </div>
                            )}
                        </div>

                        <div className="commandes-form__footer">
                            <button
                                className="app-button app-button--primary"
                                style={{ width: "100%" }}
                                onClick={handleSubmitOrder}
                                type="button"
                            >
                                <CheckCircle size={18} aria-hidden="true" />
                                Confirmer la commande
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Panneau sélection client ── */}
            {showClientPane && (
                <div className="commandes-clientPane__overlay" role="dialog" aria-modal="true" aria-label="Sélection client">
                    <div className="commandes-clientPane__panel">
                        <div className="commandes-clientPane__header">
                            <h2 className="commandes-clientPane__title">
                                {showAddClientForm ? "Nouveau client" : "Choisir un client"}
                            </h2>
                            <button
                                className="commandes-clientPane__close"
                                onClick={() => { setShowClientPane(false); setShowAddClientForm(false); setFormError(""); }}
                                type="button"
                                aria-label="Fermer"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="commandes-clientPane__body">
                            {showAddClientForm ? (
                                <div className="commandes-clientPane__addForm">
                                    <p className="commandes-clientPane__addForm-title">Créer un client</p>
                                    {formError && (
                                        <div className="commandes-error" role="alert">
                                            <AlertTriangle size={16} aria-hidden="true" />
                                            {formError}
                                        </div>
                                    )}
                                    {["nom", "prenom", "email", "telephone"].map((field) => (
                                        <div key={field} className="commandes-form__field">
                                            <label className="commandes-form__label" htmlFor={`new-client-${field}`}>
                                                {field.charAt(0).toUpperCase() + field.slice(1)}
                                                {(field === "nom" || field === "email") && " *"}
                                            </label>
                                            <input
                                                id={`new-client-${field}`}
                                                type={field === "email" ? "email" : "text"}
                                                className="app-input"
                                                value={newClientForm[field]}
                                                onChange={(e) => setNewClientForm((p) => ({ ...p, [field]: e.target.value }))}
                                            />
                                        </div>
                                    ))}
                                    <div style={{ display: "flex", gap: "var(--space-3)" }}>
                                        <button
                                            className="app-button app-button--ghost"
                                            style={{ flex: 1 }}
                                            onClick={() => setShowAddClientForm(false)}
                                            type="button"
                                        >
                                            Retour
                                        </button>
                                        <button
                                            className="app-button app-button--primary"
                                            style={{ flex: 1 }}
                                            onClick={handleAddClientSubmit}
                                            type="button"
                                        >
                                            Enregistrer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="commandes-clientPane__search">
                                        <div style={{ position: "relative" }}>
                                            <Search size={16} style={{ position: "absolute", left: "var(--space-4)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-light)", pointerEvents: "none" }} aria-hidden="true" />
                                            <input
                                                type="search"
                                                className="app-input"
                                                style={{ paddingLeft: "calc(var(--space-4) + 16px + var(--space-2))" }}
                                                placeholder="Rechercher un client…"
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                aria-label="Rechercher un client"
                                            />
                                        </div>
                                    </div>
                                    <div className="commandes-clientPane__list">
                                        {clients
                                            .filter((c) =>
                                                `${c.nom} ${c.prenom} ${c.email}`.toLowerCase().includes(clientSearch.toLowerCase())
                                            )
                                            .map((c) => (
                                                <div
                                                    key={c.id}
                                                    className="commandes-clientPane__item"
                                                    onClick={() => {
                                                        setNewOrder((p) => ({ ...p, client: `${c.nom} ${c.prenom}` }));
                                                        setShowClientPane(false);
                                                        setClientSearch("");
                                                    }}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => e.key === "Enter" && (setNewOrder((p) => ({ ...p, client: `${c.nom} ${c.prenom}` })), setShowClientPane(false))}
                                                >
                                                    <div className="commandes-clientPane__item-info">
                                                        <span className="commandes-clientPane__item-name">{c.nom} {c.prenom}</span>
                                                        <span className="commandes-clientPane__item-email">{c.email}</span>
                                                    </div>
                                                    <button
                                                        className="app-button app-button--ghost app-button--sm"
                                                        onClick={() => {
                                                            setNewOrder((p) => ({ ...p, client: `${c.nom} ${c.prenom}` }));
                                                            setShowClientPane(false);
                                                        }}
                                                        type="button"
                                                    >
                                                        Choisir
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                    <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--color-border)" }}>
                                        <button
                                            className="app-button app-button--ghost"
                                            style={{ width: "100%" }}
                                            onClick={() => { setShowAddClientForm(true); setFormError(""); }}
                                            type="button"
                                        >
                                            <Plus size={16} aria-hidden="true" />
                                            Créer un nouveau client
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Panneau sélection produits ── */}
            {showProductPane && (
                <div className="commandes-productPane__overlay" role="dialog" aria-modal="true" aria-label="Catalogue produits">
                    <div className="commandes-productPane__panel">
                        <div className="commandes-productPane__header">
                            <h2 className="commandes-productPane__title">Catalogue produits</h2>
                            <button
                                className="commandes-productPane__close"
                                onClick={() => { setShowProductPane(false); setProductSearch(""); }}
                                type="button"
                                aria-label="Fermer"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="commandes-productPane__body">
                            {/* Produits sélectionnés */}
                            <div className="commandes-productPane__section">
                                <div className="commandes-productPane__section-header">
                                    <span className="commandes-productPane__section-title">Sélection en cours</span>
                                    {newOrder.items.length > 0 && (
                                        <span className="commandes-productPane__section-count">{newOrder.items.length}</span>
                                    )}
                                </div>
                                {newOrder.items.length === 0 ? (
                                    <p style={{ padding: "var(--space-4) var(--space-5)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                                        Aucun produit ajouté.
                                    </p>
                                ) : (
                                    <div className="commandes-productPane__selected">
                                        {newOrder.items.map((it) => (
                                            <div key={it.id} className="commandes-productPane__selected-item">
                                                <span className="commandes-productPane__selected-name">{it.nom}</span>
                                                <div className="commandes-productPane__qty-controls">
                                                    <button
                                                        className="commandes-productPane__qty-btn"
                                                        onClick={() => handleUpdateQty(it.id, -1)}
                                                        type="button"
                                                        aria-label="Réduire la quantité"
                                                    >−</button>
                                                    <span className="commandes-productPane__qty-val">{it.quantite}</span>
                                                    <button
                                                        className="commandes-productPane__qty-btn"
                                                        onClick={() => handleUpdateQty(it.id, 1)}
                                                        type="button"
                                                        aria-label="Augmenter la quantité"
                                                    >+</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Catalogue */}
                            <div className="commandes-productPane__catalog">
                                <div className="commandes-productPane__catalog-search">
                                    <div style={{ position: "relative" }}>
                                        <Search size={16} style={{ position: "absolute", left: "var(--space-4)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-light)", pointerEvents: "none" }} aria-hidden="true" />
                                        <input
                                            type="search"
                                            className="app-input"
                                            style={{ paddingLeft: "calc(var(--space-4) + 16px + var(--space-2))" }}
                                            placeholder="Filtrer les produits…"
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            aria-label="Filtrer les produits"
                                        />
                                    </div>
                                </div>
                                {products
                                    .filter(
                                        (p) =>
                                            p.nom.toLowerCase().includes(productSearch.toLowerCase()) &&
                                            !newOrder.items.some((i) => i.id === p.id)
                                    )
                                    .map((p) => (
                                        <div key={p.id} className="commandes-productPane__catalog-item">
                                            <div className="commandes-productPane__catalog-info">
                                                <span className="commandes-productPane__catalog-name">{p.nom}</span>
                                                <span className="commandes-productPane__catalog-meta">
                                                    {formatMontant(p.prix_unitaire)} · Stock : {p.stock}
                                                    {p.reduction > 0 && ` · Réd. ${formatMontant(p.reduction)}`}
                                                </span>
                                            </div>
                                            <button
                                                className="app-button app-button--primary app-button--sm"
                                                onClick={() => handleAddProduct(p)}
                                                type="button"
                                            >
                                                <Plus size={14} aria-hidden="true" />
                                                Ajouter
                                            </button>
                                        </div>
                                    ))}
                                {products.filter((p) => p.nom.toLowerCase().includes(productSearch.toLowerCase()) && !newOrder.items.some((i) => i.id === p.id)).length === 0 && (
                                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-6)" }}>
                                        Aucun produit disponible.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--color-border)" }}>
                            <button
                                className="app-button app-button--accent"
                                style={{ width: "100%" }}
                                onClick={() => { setShowProductPane(false); setProductSearch(""); }}
                                type="button"
                            >
                                Valider la sélection ({newOrder.items.length} produit{newOrder.items.length > 1 ? "s" : ""})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modale annulation ── */}
            {showCancelModal && orderToCancel && (
                <div className="commandes-modal__overlay" role="dialog" aria-modal="true" aria-label="Confirmer l'annulation">
                    <div className="commandes-modal__panel">
                        <div className="commandes-modal__header">
                            <h2 className="commandes-modal__title">Annuler la commande</h2>
                            <button
                                className="commandes-modal__close"
                                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                                type="button"
                                aria-label="Fermer"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="commandes-modal__body">
                            <p className="commandes-modal__desc">
                                Vous êtes sur le point d'annuler la commande de{" "}
                                <strong>{orderToCancel.client}</strong>{" "}
                                ({formatMontant(orderToCancel.montant)}). Cette action est irréversible.
                            </p>
                            <div>
                                <label className="commandes-modal__label" htmlFor="cancel-reason">
                                    Motif d'annulation *
                                </label>
                                <textarea
                                    id="cancel-reason"
                                    className="commandes-modal__textarea"
                                    placeholder="Précisez le motif de l'annulation…"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="commandes-modal__footer">
                            <button
                                className="app-button app-button--ghost"
                                style={{ flex: 1 }}
                                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                                type="button"
                            >
                                Retour
                            </button>
                            <button
                                className="app-button"
                                style={{ flex: 1, backgroundColor: "var(--color-error)", color: "#fff" }}
                                onClick={handleCancelConfirm}
                                type="button"
                            >
                                Confirmer l'annulation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

// ─── Sous-composants utilitaires ───────────────────────────────────────────────

function EmptyState({ icon, title, desc }) {
    return (
        <div className="commandes-empty" role="status">
            <div className="commandes-empty__icon" aria-hidden="true">{icon}</div>
            <h3 className="commandes-empty__title">{title}</h3>
            <p className="commandes-empty__desc">{desc}</p>
        </div>
    );
}

export default Commandes;
