import { useState, useEffect, useRef, useCallback } from "react";
import {
    ShoppingCart, Search, X, Plus, AlertTriangle, ChevronRight,
    Download, User, Package, XCircle, CheckCircle, Bell,
    Clock, RefreshCw, SlidersHorizontal, FileDown, CreditCard, Truck,
} from "lucide-react";
import {
    getBadgeConfig, formatMontant, formatDate,
    fetchVentesCommandes, fetchVentesCommandeById, createVentesCommande, annulerVentesCommande,
    fetchVentesClients, fetchVentesProduits, fetchVentesNotifications,
} from "../../../services/ventes.js";
import "../../../assets/styles/components/modules/ventes/commandes.css";


// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <tr className="commandes-table__row--skeleton" aria-hidden="true">
            <td><span className="commandes-skeleton__cell commandes-skeleton__cell--sm" /></td>
            <td><span className="commandes-skeleton__cell commandes-skeleton__cell--lg" /></td>
            <td><span className="commandes-skeleton__cell commandes-skeleton__cell--md" /></td>
            <td><span className="commandes-skeleton__badge" /></td>
            <td><span className="commandes-skeleton__cell commandes-skeleton__cell--sm" /></td>
            <td />
        </tr>
    );
}

function SkeletonCard() {
    return (
        <div className="commandes-card commandes-card--skeleton" aria-hidden="true">
            <div className="commandes-card__top">
                <span className="commandes-skeleton__cell commandes-skeleton__cell--sm" style={{ width: "100px", height: "12px", display: "block" }} />
                <span className="commandes-skeleton__badge" />
            </div>
            <span className="commandes-skeleton__cell commandes-skeleton__cell--lg" style={{ height: "16px", display: "block", margin: "8px 0" }} />
            <div className="commandes-card__meta">
                <span className="commandes-skeleton__cell commandes-skeleton__cell--md" style={{ height: "14px", display: "block", width: "80px" }} />
                <span className="commandes-skeleton__cell commandes-skeleton__cell--sm" style={{ height: "12px", display: "block", width: "60px" }} />
            </div>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="commandes-detail__skeleton" aria-hidden="true">
            {[3, 2, 3].map((rows, bi) => (
                <div key={bi} className="commandes-detail__block">
                    <span className="commandes-skeleton__cell commandes-skeleton__cell--sm" style={{ height: "10px", width: "120px", display: "block", marginBottom: "12px" }} />
                    {Array.from({ length: rows }).map((_, ri) => (
                        <div key={ri} className="commandes-detail__row">
                            <span className="commandes-skeleton__cell commandes-skeleton__cell--sm" style={{ height: "12px", width: "90px", display: "block" }} />
                            <span className="commandes-skeleton__cell commandes-skeleton__cell--md" style={{ height: "12px", width: "130px", display: "block" }} />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function DetailSection({ label, children }) {
    return (
        <div className="commandes-detail__block">
            <span className="commandes-detail__block-label">{label}</span>
            {children}
        </div>
    );
}

function EmptyState({ icon, title, desc }) {
    return (
        <div className="commandes-empty" role="status">
            <div className="commandes-empty__icon" aria-hidden="true">{icon}</div>
            <h3 className="commandes-empty__title">{title}</h3>
            <p className="commandes-empty__desc">{desc}</p>
        </div>
    );
}

function NotifPanel({ notifications, onClose }) {
    return (
        <div className="commandes-notif-panel" role="dialog" aria-label="Notifications">
            <div className="commandes-notif-panel__header">
                <span className="commandes-notif-panel__title">Notifications</span>
                <button className="commandes-drawer__close" onClick={onClose} type="button" aria-label="Fermer les notifications">
                    <X size={16} aria-hidden="true" />
                </button>
            </div>
            <div className="commandes-notif-panel__list">
                {notifications.length === 0 ? (
                    <p className="commandes-notif-panel__empty">Aucune notification récente.</p>
                ) : notifications.map(n => (
                    <div key={n.id} className={`commandes-notif-item${n.lue ? "" : " commandes-notif-item--unread"}`}>
                        <span className="commandes-notif-item__dot" aria-hidden="true" />
                        <div className="commandes-notif-item__body">
                            <p className="commandes-notif-item__text">{n.message}</p>
                            <span className="commandes-notif-item__time">{n.temps}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ClientPane({ clients, clientSearch, setClientSearch, showAddForm, setShowAddForm, newClientForm, setNewClientForm, formError, setFormError, onSelect, onAddClient, onClose }) {
    return (
        <div className="commandes-clientPane__overlay" role="dialog" aria-modal="true" aria-label="Sélection client">
            <div className="commandes-clientPane__panel">
                <div className="commandes-drawer__handle" aria-hidden="true">
                    <span className="commandes-drawer__handle-bar" />
                </div>
                <div className="commandes-clientPane__header">
                    <h2 className="commandes-clientPane__title">
                        {showAddForm ? "Nouveau client" : "Choisir un client"}
                    </h2>
                    <button className="commandes-clientPane__close" onClick={onClose} type="button" aria-label="Fermer">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <div className="commandes-clientPane__body">
                    {showAddForm ? (
                        <div className="commandes-clientPane__addForm">
                            {formError && (
                                <div className="commandes-error" role="alert">
                                    <AlertTriangle size={16} aria-hidden="true" />
                                    {formError}
                                </div>
                            )}
                            {[
                                { key: "nom",       label: "Nom *",      type: "text"  },
                                { key: "prenom",    label: "Prénom",     type: "text"  },
                                { key: "email",     label: "Email *",    type: "email" },
                                { key: "telephone", label: "Téléphone",  type: "tel"   },
                            ].map(({ key, label, type }) => (
                                <div key={key} className="commandes-form__field">
                                    <label className="commandes-form__label" htmlFor={`nc-${key}`}>{label}</label>
                                    <input
                                        id={`nc-${key}`}
                                        type={type}
                                        className="app-input"
                                        value={newClientForm[key]}
                                        onChange={e => setNewClientForm(p => ({ ...p, [key]: e.target.value }))}
                                    />
                                </div>
                            ))}
                            <div className="commandes-clientPane__addForm-actions">
                                <button className="app-button app-button--ghost" style={{ flex: 1 }} onClick={() => setShowAddForm(false)} type="button">
                                    Retour
                                </button>
                                <button className="app-button app-button--primary" style={{ flex: 1 }} onClick={onAddClient} type="button">
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
                                        onChange={e => setClientSearch(e.target.value)}
                                        aria-label="Rechercher un client"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="commandes-clientPane__list">
                                {clients
                                    .filter(c => `${c.nom} ${c.prenom} ${c.email} ${c.telephone}`.toLowerCase().includes(clientSearch.toLowerCase()))
                                    .map(c => (
                                        <div
                                            key={c.id}
                                            className="commandes-clientPane__item"
                                            onClick={() => onSelect(c)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={e => e.key === "Enter" && onSelect(c)}
                                        >
                                            <div className="commandes-clientPane__item-avatar" aria-hidden="true">
                                                {c.nom[0].toUpperCase()}
                                            </div>
                                            <div className="commandes-clientPane__item-info">
                                                <span className="commandes-clientPane__item-name">{c.nom} {c.prenom}</span>
                                                <span className="commandes-clientPane__item-email">{c.telephone || c.email}</span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="commandes-clientPane__footer">
                                <button
                                    className="app-button app-button--ghost"
                                    style={{ width: "100%" }}
                                    onClick={() => { setShowAddForm(true); setFormError(""); }}
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
    );
}

function ProductPane({ products, selected, productSearch, setProductSearch, onAddProduct, onUpdateQty, onClose }) {
    return (
        <div className="commandes-productPane__overlay" role="dialog" aria-modal="true" aria-label="Catalogue produits">
            <div className="commandes-productPane__panel">
                <div className="commandes-drawer__handle" aria-hidden="true">
                    <span className="commandes-drawer__handle-bar" />
                </div>
                <div className="commandes-productPane__header">
                    <h2 className="commandes-productPane__title">Catalogue produits</h2>
                    <button className="commandes-productPane__close" onClick={onClose} type="button" aria-label="Fermer">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <div className="commandes-productPane__body">
                    {/* Sélection en cours */}
                    <div className="commandes-productPane__section">
                        <div className="commandes-productPane__section-header">
                            <span className="commandes-productPane__section-title">Sélection</span>
                            {selected.length > 0 && (
                                <span className="commandes-productPane__section-count">{selected.length}</span>
                            )}
                        </div>
                        {selected.length === 0 ? (
                            <p className="commandes-productPane__empty-msg">Aucun produit ajouté pour l'instant.</p>
                        ) : (
                            <div className="commandes-productPane__selected">
                                {selected.map(it => (
                                    <div key={it.id} className="commandes-productPane__selected-item">
                                        <span className="commandes-productPane__selected-name">{it.nom}</span>
                                        <div className="commandes-productPane__qty-controls">
                                            <button
                                                className="commandes-productPane__qty-btn"
                                                onClick={() => onUpdateQty(it.id, -1)}
                                                type="button"
                                                aria-label={`Réduire la quantité de ${it.nom}`}
                                            >−</button>
                                            <span className="commandes-productPane__qty-val">{it.quantite}</span>
                                            <button
                                                className="commandes-productPane__qty-btn"
                                                onClick={() => onUpdateQty(it.id, 1)}
                                                type="button"
                                                aria-label={`Augmenter la quantité de ${it.nom}`}
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
                                    onChange={e => setProductSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        {products
                            .filter(p =>
                                p.nom.toLowerCase().includes(productSearch.toLowerCase()) &&
                                !selected.some(i => i.id === p.id)
                            )
                            .map(p => (
                                <div
                                    key={p.id}
                                    className="commandes-productPane__catalog-item"
                                    onClick={() => onAddProduct(p)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => e.key === "Enter" && onAddProduct(p)}
                                >
                                    <div className="commandes-productPane__catalog-info">
                                        <span className="commandes-productPane__catalog-name">{p.nom}</span>
                                        <span className="commandes-productPane__catalog-meta">
                                            {formatMontant(p.prix_unitaire)}
                                            {p.reduction > 0 && <> · Réd. {formatMontant(p.reduction)}</>}
                                            {" "}· Stock&nbsp;: {p.stock}
                                        </span>
                                    </div>
                                    <button
                                        className="app-button app-button--primary app-button--sm"
                                        onClick={e => { e.stopPropagation(); onAddProduct(p); }}
                                        type="button"
                                    >
                                        <Plus size={14} aria-hidden="true" />
                                        Ajouter
                                    </button>
                                </div>
                            ))
                        }
                        {products.filter(p => p.nom.toLowerCase().includes(productSearch.toLowerCase()) && !selected.some(i => i.id === p.id)).length === 0 && (
                            <p className="commandes-productPane__empty-msg">Aucun produit disponible.</p>
                        )}
                    </div>
                </div>
                <div className="commandes-productPane__footer">
                    <button
                        className="app-button app-button--accent"
                        style={{ width: "100%" }}
                        onClick={onClose}
                        type="button"
                    >
                        Valider la sélection
                        {selected.length > 0 && ` (${selected.length} produit${selected.length > 1 ? "s" : ""})`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────────────────────────

function Commandes() {
    // ── LISTE ──
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore]       = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [fetchError, setFetchError] = useState(null);

    // ── DÉTAIL ──
    const [selectedOrder, setSelectedOrder]   = useState(null);
    const [detailData, setDetailData]         = useState(null);
    const [loadingDetail, setLoadingDetail]   = useState(false);

    // ── RECHERCHE & FILTRES ──
    const [searchQuery, setSearchQuery]       = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [showFilters, setShowFilters]       = useState(false);
    const [filters, setFilters] = useState({
        statut: "tous", dateDebut: "", dateFin: "", montantMin: "", montantMax: "",
    });
    const [pendingFilters, setPendingFilters] = useState({ ...filters });

    // ── EXPORT ──
    const [showExport, setShowExport] = useState(false);
    const exportRef = useRef(null);

    // ── NOTIFICATIONS ──
    const [notifCount, setNotifCount]         = useState(0);
    const [notifications, setNotifications]   = useState([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);

    // ── NOUVELLE COMMANDE ──
    const [view, setView]     = useState("list");
    const [newOrder, setNewOrder] = useState({
        client_id: "", client: "", items: [],
        adresse: "", date_livraison: "", notes: "",
    });
    const [showClientPane, setShowClientPane]   = useState(false);
    const [showProductPane, setShowProductPane] = useState(false);
    const [clients, setClients]                 = useState([]);
    const [products, setProducts]               = useState([]);
    const [clientSearch, setClientSearch]       = useState("");
    const [productSearch, setProductSearch]     = useState("");
    const [newClientForm, setNewClientForm] = useState({ nom: "", prenom: "", email: "", telephone: "" });
    const [showAddClientForm, setShowAddClientForm] = useState(false);
    const [saving, setSaving]     = useState(false);
    const [formError, setFormError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // ── ANNULATION ──
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel]     = useState(null);
    const [cancelReason, setCancelReason]       = useState("");
    const [canceling, setCanceling]             = useState(false);

    const sentinelRef = useRef(null);
    const notifRef    = useRef(null);

    // ── CHARGEMENT INITIAL ──────────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        setFetchError(null);
        fetchVentesCommandes()
            .then(data => {
                setOrders(data.data || []);
                setHasMore(data.meta?.has_more ?? false);
                setCurrentPage(1);
            })
            .catch(() => setFetchError("Impossible de charger les commandes. Vérifiez votre connexion."))
            .finally(() => setLoading(false));
    }, []);

    // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
    useEffect(() => {
        fetchVentesNotifications()
            .then(data => {
                setNotifCount(data.non_lues || 0);
                setNotifications(data.notifications || []);
            })
            .catch(() => {});
    }, []);

    // ── CLIENTS (chargés à l'ouverture du formulaire) ──────────────────────────
    useEffect(() => {
        if (view !== "new") return;
        fetchVentesClients()
            .then(data => setClients(data.data || []))
            .catch(() => {});
    }, [view]);

    // ── PRODUITS (chargés à la première ouverture du catalogue) ────────────────
    useEffect(() => {
        if (!showProductPane || products.length > 0) return;
        fetchVentesProduits().then(setProducts).catch(() => {});
    }, [showProductPane, products.length]);

    // ── DEBOUNCE 300ms ─────────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // ── INFINITE SCROLL ────────────────────────────────────────────────────────
    const loadMoreOrders = useCallback(() => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        fetchVentesCommandes({ page: currentPage + 1 })
            .then(data => {
                setOrders(prev => [...prev, ...(data.data || [])]);
                setHasMore(data.meta?.has_more ?? false);
                setCurrentPage(p => p + 1);
            })
            .catch(() => {})
            .finally(() => setLoadingMore(false));
    }, [loadingMore, hasMore, currentPage]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const obs = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) loadMoreOrders(); },
            { threshold: 0.1 }
        );
        obs.observe(sentinel);
        return () => obs.disconnect();
    }, [loadMoreOrders]);

    // ── FERMER EXPORT AU CLIC EXTÉRIEUR ────────────────────────────────────────
    useEffect(() => {
        if (!showExport) return;
        const handler = e => {
            if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showExport]);

    // ── FERMER NOTIF PANEL AU CLIC EXTÉRIEUR ──────────────────────────────────
    useEffect(() => {
        if (!showNotifPanel) return;
        const handler = e => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showNotifPanel]);

    // ── FILTRAGE LOCAL ─────────────────────────────────────────────────────────
    const filteredOrders = orders.filter(o => {
        const q = debouncedQuery.toLowerCase();
        const matchSearch = !q ||
            o.client.toLowerCase().includes(q) ||
            o.numero.toLowerCase().includes(q) ||
            o.statut.toLowerCase().includes(q);
        const matchStatut   = filters.statut === "tous"  || o.statut === filters.statut;
        const matchDateMin  = !filters.dateDebut          || o.date >= filters.dateDebut;
        const matchDateMax  = !filters.dateFin            || o.date <= filters.dateFin;
        const matchMontMin  = !filters.montantMin         || o.montant >= Number(filters.montantMin);
        const matchMontMax  = !filters.montantMax         || o.montant <= Number(filters.montantMax);
        return matchSearch && matchStatut && matchDateMin && matchDateMax && matchMontMin && matchMontMax;
    });

    const hasActiveFilters =
        filters.statut !== "tous" || filters.dateDebut || filters.dateFin ||
        filters.montantMin || filters.montantMax;

    // ── KPI ────────────────────────────────────────────────────────────────────
    const kpis = [
        { label: "Total",     value: orders.length,                                                       icon: ShoppingCart, variant: "primary" },
        { label: "En cours",  value: orders.filter(o => ["reçu","validé"].includes(o.statut)).length,      icon: Clock,        variant: "info"    },
        { label: "Livrées",   value: orders.filter(o => o.statut === "livré").length,                      icon: CheckCircle,  variant: "success" },
        { label: "Annulées",  value: orders.filter(o => o.statut === "annulé").length,                     icon: XCircle,      variant: "warning" },
    ];

    // ── CALCUL TOTAL ───────────────────────────────────────────────────────────
    const calcTotal = items =>
        items.reduce((acc, it) => acc + (it.quantite * it.prix_unitaire - (it.reduction || 0)), 0);

    // ── DÉTAIL : chargé à l'ouverture du drawer ────────────────────────────────
    const openDetail = order => {
        setSelectedOrder(order);
        setDetailData(null);
        setLoadingDetail(true);
        fetchVentesCommandeById(order.id)
            .then(data => setDetailData(data))
            .catch(() => setDetailData({ error: true }))
            .finally(() => setLoadingDetail(false));
    };

    // ── PRODUITS ───────────────────────────────────────────────────────────────
    const handleAddProduct = product => {
        if (newOrder.items.some(i => i.id === product.id)) return;
        setNewOrder(p => ({ ...p, items: [...p.items, { ...product, quantite: 1 }] }));
    };

    const handleUpdateQty = (id, delta) => {
        setNewOrder(p => ({
            ...p,
            items: p.items
                .map(it => it.id === id ? { ...it, quantite: it.quantite + delta } : it)
                .filter(it => it.quantite > 0),
        }));
    };

    // ── CRÉATION CLIENT ────────────────────────────────────────────────────────
    const handleAddClientSubmit = () => {
        if (!newClientForm.nom || !newClientForm.email) {
            setFormError("Le nom et l'email sont obligatoires.");
            return;
        }
        if (clients.some(c => c.email.toLowerCase() === newClientForm.email.toLowerCase())) {
            setFormError("Un client avec cet email existe déjà.");
            return;
        }
        const created = { id: `cli_${Date.now()}`, ...newClientForm };
        setClients(prev => [created, ...prev]);
        setNewOrder(p => ({ ...p, client_id: created.id, client: `${created.nom} ${created.prenom}` }));
        setNewClientForm({ nom: "", prenom: "", email: "", telephone: "" });
        setShowAddClientForm(false);
        setShowClientPane(false);
        setFormError("");
    };

    // ── SOUMETTRE COMMANDE ─────────────────────────────────────────────────────
    const handleSubmitOrder = () => {
        if (!newOrder.client_id) { setFormError("Veuillez sélectionner un client."); return; }
        if (!newOrder.items.length) { setFormError("Veuillez ajouter au moins un produit."); return; }
        for (const it of newOrder.items) {
            if (it.quantite > it.stock) {
                setFormError(`Stock insuffisant pour « ${it.nom} ».`);
                return;
            }
        }
        setSaving(true);
        createVentesCommande({
            client_id:      newOrder.client_id,
            produits:       newOrder.items.map(it => ({ id: it.id, quantite: it.quantite })),
            adresse:        newOrder.adresse,
            date_livraison: newOrder.date_livraison,
            notes:          newOrder.notes,
        })
            .then(res => {
                const created = res.data ?? res ?? {};
                const numero  = created.numero ?? `CMD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(5, "0")}`;
                const newCmd  = {
                    id:      created.id ?? `cmd_${Date.now()}`,
                    numero,
                    client:  newOrder.client,
                    montant: calcTotal(newOrder.items),
                    statut:  created.statut ?? "reçu",
                    date:    new Date().toISOString().slice(0, 10),
                };
                setOrders(prev => [newCmd, ...prev]);
                setNewOrder({ client_id: "", client: "", items: [], adresse: "", date_livraison: "", notes: "" });
                setFormError("");
                setView("list");
                setSuccessMsg(`${numero} créée avec succès.`);
                setTimeout(() => setSuccessMsg(""), 4000);
            })
            .catch(() => setFormError("Erreur lors de la création. Réessayez."))
            .finally(() => setSaving(false));
    };

    // ── ANNULATION ─────────────────────────────────────────────────────────────
    const handleCancelConfirm = () => {
        if (cancelReason.trim().length < 20) {
            alert("Le motif doit contenir au moins 20 caractères.");
            return;
        }
        setCanceling(true);
        annulerVentesCommande(orderToCancel.id, cancelReason)
            .then(() => {
                setOrders(prev => prev.map(o => o.id === orderToCancel.id ? { ...o, statut: "annulé" } : o));
                if (selectedOrder?.id === orderToCancel.id) {
                    setSelectedOrder(p => ({ ...p, statut: "annulé" }));
                }
                setShowCancelModal(false);
                setOrderToCancel(null);
                setCancelReason("");
            })
            .catch(() => alert("Erreur lors de l'annulation."))
            .finally(() => setCanceling(false));
    };

    const openCancel = (order, e) => {
        e?.stopPropagation();
        setOrderToCancel(order);
        setShowCancelModal(true);
    };

    const resetForm = () => {
        setView("list");
        setNewOrder({ client_id: "", client: "", items: [], adresse: "", date_livraison: "", notes: "" });
        setFormError("");
        setShowClientPane(false);
        setShowProductPane(false);
    };

    const canCancel = s => ["reçu", "validé", "en cours de livraison"].includes(s);

    const applyFilters = () => { setFilters({ ...pendingFilters }); setShowFilters(false); };
    const resetFilters = () => {
        const clean = { statut: "tous", dateDebut: "", dateFin: "", montantMin: "", montantMax: "" };
        setFilters(clean);
        setPendingFilters(clean);
        setShowFilters(false);
    };

    // ── RENDU ──────────────────────────────────────────────────────────────────
    return (
        <section className="commandes-root" aria-label="Gestion des commandes">

            {/* Toast succès */}
            {successMsg && (
                <div className="commandes-toast commandes-toast--success" role="status" aria-live="polite">
                    <CheckCircle size={18} aria-hidden="true" />
                    {successMsg}
                </div>
            )}

            {/* ── Header ── */}
            <header className="commandes-header">
                <div className="commandes-header__left">
                    <h1 className="commandes-header__title">Commandes</h1>
                    <p className="commandes-header__subtitle">
                        Créez, suivez et gérez toutes vos commandes clients.
                    </p>
                </div>
                <div className="commandes-header__actions">
                    <div className="commandes-notif-wrap" ref={notifRef}>
                        <button
                            className="commandes-notif-btn"
                            onClick={() => setShowNotifPanel(p => !p)}
                            type="button"
                            aria-label={`Notifications — ${notifCount} non lue${notifCount > 1 ? "s" : ""}`}
                        >
                            <Bell size={20} aria-hidden="true" />
                            {notifCount > 0 && (
                                <span className="commandes-notif-badge" aria-hidden="true">
                                    {notifCount > 9 ? "9+" : notifCount}
                                </span>
                            )}
                        </button>
                        {showNotifPanel && (
                            <NotifPanel
                                notifications={notifications}
                                onClose={() => setShowNotifPanel(false)}
                            />
                        )}
                    </div>
                    <button
                        className="app-button app-button--primary"
                        onClick={() => { setView("new"); setFormError(""); }}
                        type="button"
                    >
                        <Plus size={18} aria-hidden="true" />
                        Nouvelle commande
                    </button>
                </div>
            </header>

            {/* ── KPIs ── */}
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

            {/* ── Toolbar ── */}
            <div className="commandes-toolbar">
                <div className="commandes-toolbar__row">
                    <div className="commandes-search">
                        <Search size={16} className="commandes-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input commandes-search__input"
                            placeholder="Rechercher une commande..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            aria-label="Rechercher une commande"
                        />
                    </div>
                    <button
                        className={`app-button app-button--ghost commandes-filter-btn${hasActiveFilters ? " commandes-filter-btn--active" : ""}`}
                        onClick={() => { setPendingFilters(filters); setShowFilters(true); }}
                        type="button"
                    >
                        <SlidersHorizontal size={16} aria-hidden="true" />
                        Filtres
                        {hasActiveFilters && <span className="commandes-filter-btn__dot" aria-hidden="true" />}
                    </button>
                    <div className="commandes-export-wrap" ref={exportRef}>
                        <button
                            className="app-button app-button--ghost"
                            onClick={() => setShowExport(p => !p)}
                            type="button"
                            aria-expanded={showExport}
                            aria-haspopup="menu"
                        >
                            <FileDown size={16} aria-hidden="true" />
                            Exporter
                        </button>
                        {showExport && (
                            <div className="commandes-export-menu" role="menu">
                                {["CSV", "PDF", "DOCX"].map(fmt => (
                                    <button
                                        key={fmt}
                                        className="commandes-export-menu__item"
                                        onClick={() => { alert(`Export ${fmt} — ${filteredOrders.length} commandes`); setShowExport(false); }}
                                        type="button"
                                        role="menuitem"
                                    >
                                        <Download size={14} aria-hidden="true" />
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="commandes-filter-pills" aria-label="Filtres actifs">
                        {filters.statut !== "tous" && (
                            <span className="commandes-filter-pill">
                                Statut&nbsp;: {filters.statut}
                                <button onClick={() => setFilters(p => ({ ...p, statut: "tous" }))} type="button" aria-label="Supprimer filtre statut">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {(filters.dateDebut || filters.dateFin) && (
                            <span className="commandes-filter-pill">
                                Période
                                <button onClick={() => setFilters(p => ({ ...p, dateDebut: "", dateFin: "" }))} type="button" aria-label="Supprimer filtre période">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {(filters.montantMin || filters.montantMax) && (
                            <span className="commandes-filter-pill">
                                Montant
                                <button onClick={() => setFilters(p => ({ ...p, montantMin: "", montantMax: "" }))} type="button" aria-label="Supprimer filtre montant">
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ── Liste ── */}
            {loading ? (
                <>
                    <div className="commandes-tableWrap" aria-hidden="true">
                        <table className="commandes-table">
                            <thead className="commandes-table__head">
                                <tr><th>N°</th><th>Client</th><th>Montant</th><th>Statut</th><th>Date</th><th /></tr>
                            </thead>
                            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
                        </table>
                    </div>
                    <div className="commandes-cards" aria-hidden="true">
                        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </>
            ) : fetchError ? (
                <div className="commandes-error-state" role="alert">
                    <AlertTriangle size={36} aria-hidden="true" />
                    <p className="commandes-error-state__text">{fetchError}</p>
                    <button
                        className="app-button app-button--ghost"
                        onClick={() => window.location.reload()}
                        type="button"
                    >
                        <RefreshCw size={16} aria-hidden="true" />
                        Réessayer
                    </button>
                </div>
            ) : filteredOrders.length === 0 ? (
                <EmptyState
                    icon={<ShoppingCart size={36} />}
                    title="Aucune commande trouvée"
                    desc={debouncedQuery || hasActiveFilters
                        ? "Modifiez vos filtres pour afficher des résultats."
                        : "Créez votre première commande en cliquant sur « Nouvelle commande »."
                    }
                />
            ) : (
                <>
                    {/* Table (desktop) */}
                    <div className="commandes-tableWrap" role="region" aria-label="Liste des commandes">
                        <table className="commandes-table" aria-label="Commandes">
                            <thead className="commandes-table__head">
                                <tr>
                                    <th scope="col">N°</th>
                                    <th scope="col">Client</th>
                                    <th scope="col">Montant</th>
                                    <th scope="col">Statut</th>
                                    <th scope="col">Date</th>
                                    <th scope="col" />
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => {
                                    const badge = getBadgeConfig(order.statut);
                                    return (
                                        <tr
                                            key={order.id}
                                            className="commandes-table__row"
                                            onClick={() => openDetail(order)}
                                        >
                                            <td className="commandes-table__id">{order.numero}</td>
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
                                                        onClick={e => openCancel(order, e)}
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

                    {/* Cartes (mobile) */}
                    <div className="commandes-cards" aria-label="Commandes">
                        {filteredOrders.map(order => {
                            const badge = getBadgeConfig(order.statut);
                            return (
                                <article
                                    key={order.id}
                                    className="commandes-card"
                                    onClick={() => openDetail(order)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => e.key === "Enter" && openDetail(order)}
                                    aria-label={`Commande ${order.numero} — ${order.client}`}
                                >
                                    <div className="commandes-card__top">
                                        <span className="commandes-card__id">{order.numero}</span>
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
                                                onClick={e => openCancel(order, e)}
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

                    {/* Sentinel infinite scroll */}
                    <div ref={sentinelRef} className="commandes-sentinel" aria-hidden="true" />
                    {loadingMore && (
                        <div className="commandes-loadingMore" aria-label="Chargement en cours">
                            <RefreshCw size={20} className="commandes-spin" aria-hidden="true" />
                            <span>Chargement…</span>
                        </div>
                    )}
                </>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                Drawer — Détail commande
            ══════════════════════════════════════════════════════════════════ */}
            {selectedOrder && (
                <>
                    <div
                        className="commandes-drawer__overlay"
                        onClick={() => { setSelectedOrder(null); setDetailData(null); }}
                        aria-hidden="true"
                    />
                    <aside className="commandes-drawer" aria-label={`Détail ${selectedOrder.numero}`}>
                        <div className="commandes-drawer__handle" aria-hidden="true">
                            <span className="commandes-drawer__handle-bar" />
                        </div>
                        <div className="commandes-drawer__header">
                            <div>
                                <h2 className="commandes-drawer__title">{selectedOrder.numero}</h2>
                                {(() => {
                                    const b = getBadgeConfig(selectedOrder.statut);
                                    return <span className={`ventes-badge ventes-badge--${b.variant}`} style={{ marginTop: "4px", display: "inline-block" }}>{b.label}</span>;
                                })()}
                            </div>
                            <button
                                className="commandes-drawer__close"
                                onClick={() => { setSelectedOrder(null); setDetailData(null); }}
                                aria-label="Fermer"
                                type="button"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="commandes-drawer__body">
                            {loadingDetail ? (
                                <DetailSkeleton />
                            ) : detailData?.error ? (
                                <p className="commandes-detail__error">
                                    <AlertTriangle size={16} aria-hidden="true" />
                                    Impossible de charger le détail de cette commande.
                                </p>
                            ) : detailData ? (
                                <>
                                    {/* Section 1 — Infos générales */}
                                    <DetailSection label="Informations générales">
                                        {[
                                            ["Client",          detailData.client ? `${detailData.client.nom} ${detailData.client.prenom}` : selectedOrder.client],
                                            ["Téléphone",       detailData.client?.telephone || "—"],
                                            ["Email",           detailData.client?.email || "—"],
                                            ["Total",           formatMontant(detailData.commande?.montant ?? selectedOrder.montant)],
                                            ["Date livraison",  formatDate(detailData.commande?.date_livraison || selectedOrder.date)],
                                            ["Adresse",         detailData.commande?.adresse || "—"],
                                            detailData.commande?.notes && ["Notes", detailData.commande.notes],
                                        ].filter(Boolean).map(([k, v]) => (
                                            <div key={k} className="commandes-detail__row">
                                                <span className="commandes-detail__key">{k}</span>
                                                <span className="commandes-detail__val">{v}</span>
                                            </div>
                                        ))}
                                    </DetailSection>

                                    {/* Section 2 — Produits */}
                                    {detailData.produits?.length > 0 && (
                                        <DetailSection label={`Produits — ${detailData.produits.length} article${detailData.produits.length > 1 ? "s" : ""}`}>
                                            {detailData.produits.map(prod => (
                                                <div key={prod.id} className="commandes-product-card">
                                                    <Package size={16} className="commandes-product-card__icon" aria-hidden="true" />
                                                    <div className="commandes-product-card__info">
                                                        <span className="commandes-product-card__name">{prod.nom}</span>
                                                        <span className="commandes-product-card__qty">
                                                            {prod.quantite} × {formatMontant(prod.prix_unitaire)}
                                                        </span>
                                                    </div>
                                                    <span className="commandes-product-card__total">
                                                        {formatMontant(prod.montant)}
                                                    </span>
                                                </div>
                                            ))}
                                        </DetailSection>
                                    )}

                                    {/* Section 3 — Paiements */}
                                    <DetailSection label="Paiements">
                                        {!detailData.paiements?.length ? (
                                            <p className="commandes-payments__empty">
                                                Aucun paiement enregistré. Les encaissements s'effectuent au pôle Finance.
                                            </p>
                                        ) : (
                                            <div className="commandes-timeline">
                                                {detailData.paiements.map((p, i) => (
                                                    <div key={i} className={`commandes-timeline__item${i < detailData.paiements.length - 1 ? " commandes-timeline__item--connected" : ""}`}>
                                                        <div className="commandes-timeline__dot commandes-timeline__dot--success" aria-hidden="true">
                                                            <CreditCard size={10} />
                                                        </div>
                                                        <div className="commandes-timeline__content">
                                                            <div className="commandes-timeline__header">
                                                                <span className="commandes-timeline__amount">{formatMontant(p.montant)}</span>
                                                                <span className="commandes-timeline__date">{formatDate(p.date)}</span>
                                                            </div>
                                                            <span className="commandes-timeline__mode">{p.mode}</span>
                                                            {p.reference && <span className="commandes-timeline__ref">{p.reference}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </DetailSection>

                                    {/* Section 4 — Livraisons */}
                                    <DetailSection label="Livraisons">
                                        {!detailData.livraisons?.length ? (
                                            <p className="commandes-payments__empty">
                                                Aucune livraison créée pour cette commande.
                                            </p>
                                        ) : (
                                            <div className="commandes-timeline">
                                                {detailData.livraisons.map((l, i) => {
                                                    const dot = l.statut === "livrée" ? "success" : l.statut === "en cours" ? "warning" : "neutral";
                                                    return (
                                                        <div key={i} className={`commandes-timeline__item${i < detailData.livraisons.length - 1 ? " commandes-timeline__item--connected" : ""}`}>
                                                            <div className={`commandes-timeline__dot commandes-timeline__dot--${dot}`} aria-hidden="true">
                                                                <Truck size={10} />
                                                            </div>
                                                            <div className="commandes-timeline__content">
                                                                <div className="commandes-timeline__header">
                                                                    <span className="commandes-timeline__mode" style={{ textTransform: "capitalize" }}>{l.statut}</span>
                                                                    <span className="commandes-timeline__date">{formatDate(l.date)}</span>
                                                                </div>
                                                                {l.note && <span className="commandes-timeline__ref">{l.note}</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </DetailSection>
                                </>
                            ) : null}
                        </div>

                        {/* Section 5 — Actions selon statut */}
                        {canCancel(selectedOrder.statut) && (
                            <div className="commandes-drawer__footer">
                                <button
                                    className="app-button"
                                    style={{ backgroundColor: "var(--color-error)", color: "#fff", width: "100%" }}
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

            {/* ══════════════════════════════════════════════════════════════════
                Panel — Nouvelle commande
            ══════════════════════════════════════════════════════════════════ */}
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

                            {/* Étape 1 — Client */}
                            <div className="commandes-form__section">
                                <span className="commandes-form__section-label">
                                    <span className="commandes-form__section-step">1</span>
                                    Client
                                </span>
                                <button
                                    className={`commandes-form__selector${newOrder.client_id ? " commandes-form__selector--active" : ""}`}
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

                            {/* Étape 2 — Produits */}
                            <div className="commandes-form__section">
                                <span className="commandes-form__section-label">
                                    <span className="commandes-form__section-step">2</span>
                                    Produits
                                </span>
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

                            {/* Étape 3 — Livraison */}
                            <div className="commandes-form__section">
                                <span className="commandes-form__section-label">
                                    <span className="commandes-form__section-step">3</span>
                                    Livraison
                                </span>
                                <div className="commandes-form__field">
                                    <label className="commandes-form__label" htmlFor="cmd-adresse">Adresse</label>
                                    <textarea
                                        id="cmd-adresse"
                                        className="app-input"
                                        rows={2}
                                        placeholder="Quartier, rue, ville…"
                                        value={newOrder.adresse}
                                        onChange={e => setNewOrder(p => ({ ...p, adresse: e.target.value }))}
                                        style={{ resize: "vertical" }}
                                    />
                                </div>
                                <div className="commandes-form__field">
                                    <label className="commandes-form__label" htmlFor="cmd-date">Date souhaitée</label>
                                    <input
                                        id="cmd-date"
                                        type="date"
                                        className="app-input"
                                        value={newOrder.date_livraison}
                                        onChange={e => setNewOrder(p => ({ ...p, date_livraison: e.target.value }))}
                                    />
                                </div>
                                <div className="commandes-form__field">
                                    <label className="commandes-form__label" htmlFor="cmd-notes">Notes (optionnel)</label>
                                    <textarea
                                        id="cmd-notes"
                                        className="app-input"
                                        rows={2}
                                        placeholder="Instructions particulières…"
                                        value={newOrder.notes}
                                        onChange={e => setNewOrder(p => ({ ...p, notes: e.target.value }))}
                                        style={{ resize: "vertical" }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Récapitulatif sticky */}
                        <div className="commandes-form__recap">
                            <div className="commandes-form__recap-row">
                                <span className="commandes-form__recap-label">Sous-total</span>
                                <span className="commandes-form__recap-value">{formatMontant(calcTotal(newOrder.items))}</span>
                            </div>
                            <div className="commandes-form__recap-divider" aria-hidden="true" />
                            <div className="commandes-form__recap-row commandes-form__recap-row--total">
                                <span className="commandes-form__recap-label-bold">Total</span>
                                <span className="commandes-form__recap-total">{formatMontant(calcTotal(newOrder.items))}</span>
                            </div>
                        </div>

                        <div className="commandes-form__footer">
                            <button
                                className="app-button app-button--primary"
                                style={{ width: "100%", height: "56px", fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)" }}
                                onClick={handleSubmitOrder}
                                disabled={saving}
                                type="button"
                            >
                                {saving ? (
                                    <RefreshCw size={18} className="commandes-spin" aria-hidden="true" />
                                ) : (
                                    <CheckCircle size={18} aria-hidden="true" />
                                )}
                                {saving ? "Enregistrement…" : "Confirmer la commande"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sélection client ── */}
            {showClientPane && (
                <ClientPane
                    clients={clients}
                    clientSearch={clientSearch}
                    setClientSearch={setClientSearch}
                    showAddForm={showAddClientForm}
                    setShowAddForm={setShowAddClientForm}
                    newClientForm={newClientForm}
                    setNewClientForm={setNewClientForm}
                    formError={formError}
                    setFormError={setFormError}
                    onSelect={c => {
                        setNewOrder(p => ({ ...p, client_id: c.id, client: `${c.nom} ${c.prenom}` }));
                        setShowClientPane(false);
                        setClientSearch("");
                    }}
                    onAddClient={handleAddClientSubmit}
                    onClose={() => { setShowClientPane(false); setShowAddClientForm(false); setFormError(""); }}
                />
            )}

            {/* ── Sélection produits ── */}
            {showProductPane && (
                <ProductPane
                    products={products}
                    selected={newOrder.items}
                    productSearch={productSearch}
                    setProductSearch={setProductSearch}
                    onAddProduct={handleAddProduct}
                    onUpdateQty={handleUpdateQty}
                    onClose={() => { setShowProductPane(false); setProductSearch(""); }}
                />
            )}

            {/* ══════════════════════════════════════════════════════════════════
                Bottom Sheet — Filtres
            ══════════════════════════════════════════════════════════════════ */}
            {showFilters && (
                <>
                    <div className="commandes-sheet__overlay" onClick={() => setShowFilters(false)} aria-hidden="true" />
                    <div className="commandes-sheet" role="dialog" aria-modal="true" aria-label="Filtres">
                        <div className="commandes-drawer__handle" aria-hidden="true">
                            <span className="commandes-drawer__handle-bar" />
                        </div>
                        <div className="commandes-sheet__header">
                            <h2 className="commandes-sheet__title">Filtres</h2>
                            <button
                                className="commandes-drawer__close"
                                onClick={() => setShowFilters(false)}
                                type="button"
                                aria-label="Fermer"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="commandes-sheet__body">
                            <div className="commandes-form__field">
                                <label className="commandes-form__label" htmlFor="flt-statut">Statut</label>
                                <select
                                    id="flt-statut"
                                    className="commandes-filter-select"
                                    style={{ width: "100%" }}
                                    value={pendingFilters.statut}
                                    onChange={e => setPendingFilters(p => ({ ...p, statut: e.target.value }))}
                                >
                                    <option value="tous">Tous les statuts</option>
                                    <option value="reçu">Reçu</option>
                                    <option value="validé">Validé</option>
                                    <option value="en cours de livraison">En livraison</option>
                                    <option value="livré">Livré</option>
                                    <option value="annulé">Annulé</option>
                                </select>
                            </div>
                            <div className="commandes-form__fields-row">
                                <div className="commandes-form__field">
                                    <label className="commandes-form__label" htmlFor="flt-date-debut">Date début</label>
                                    <input id="flt-date-debut" type="date" className="app-input" value={pendingFilters.dateDebut} onChange={e => setPendingFilters(p => ({ ...p, dateDebut: e.target.value }))} />
                                </div>
                                <div className="commandes-form__field">
                                    <label className="commandes-form__label" htmlFor="flt-date-fin">Date fin</label>
                                    <input id="flt-date-fin" type="date" className="app-input" value={pendingFilters.dateFin} onChange={e => setPendingFilters(p => ({ ...p, dateFin: e.target.value }))} />
                                </div>
                            </div>
                            <div className="commandes-form__fields-row">
                                <div className="commandes-form__field">
                                    <label className="commandes-form__label" htmlFor="flt-min">Montant min (FCFA)</label>
                                    <input id="flt-min" type="number" className="app-input" placeholder="0" value={pendingFilters.montantMin} onChange={e => setPendingFilters(p => ({ ...p, montantMin: e.target.value }))} />
                                </div>
                                <div className="commandes-form__field">
                                    <label className="commandes-form__label" htmlFor="flt-max">Montant max (FCFA)</label>
                                    <input id="flt-max" type="number" className="app-input" placeholder="—" value={pendingFilters.montantMax} onChange={e => setPendingFilters(p => ({ ...p, montantMax: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="commandes-sheet__footer">
                            <button className="app-button app-button--ghost" onClick={resetFilters} type="button" style={{ flex: 1 }}>
                                Réinitialiser
                            </button>
                            <button className="app-button app-button--primary" onClick={applyFilters} type="button" style={{ flex: 2 }}>
                                Appliquer
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                Modal — Annulation
            ══════════════════════════════════════════════════════════════════ */}
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
                                Vous êtes sur le point d'annuler la commande{" "}
                                <strong>{orderToCancel.numero}</strong>{" "}
                                de <strong>{orderToCancel.client}</strong>{" "}
                                ({formatMontant(orderToCancel.montant)}).{" "}
                                Cette action est irréversible.
                            </p>
                            <div className="commandes-form__field">
                                <label className="commandes-modal__label" htmlFor="cancel-reason">
                                    Motif d'annulation *
                                </label>
                                <textarea
                                    id="cancel-reason"
                                    className="commandes-modal__textarea"
                                    placeholder="Précisez le motif de l'annulation…"
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                    rows={3}
                                />
                                <span className="commandes-modal__char-count" style={{ color: cancelReason.length >= 20 ? "var(--color-success)" : "var(--color-error)" }}>
                                    {cancelReason.length} / 20 caractères minimum
                                </span>
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
                                disabled={canceling || cancelReason.trim().length < 20}
                                type="button"
                            >
                                {canceling
                                    ? <RefreshCw size={16} className="commandes-spin" aria-hidden="true" />
                                    : "Confirmer l'annulation"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Commandes;
