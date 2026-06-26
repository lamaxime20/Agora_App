import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Search, Filter, X, FileText, ClipboardList,
    AlertCircle, ChevronUp, ChevronDown, ChevronsUpDown,
    ChevronLeft, ChevronRight
} from "lucide-react";
import PaneDetailsTransaction from "./paneDetailsTransaction.jsx";
import { fetchStockHistorique } from "../../../../services/gestionStock.js";
import { exportHistoriqueTransactions } from "../../../../services/exportService.js";
import "../../../../assets/styles/components/modules/gestionStocks/historiqueTransactions.css";

/* ─── Config des types ────────────────────────────────────────────────────────── */

import {
    ArrowDownToLine, AlertTriangle, Truck, Undo2,
    Archive, PackagePlus, Pencil
} from "lucide-react";

export const TYPE_CONFIG = {
    ravitaillement:               { label: "Réapprovisionnement", short: "Réappro.",  icon: ArrowDownToLine, mod: "ravitaillement"               },
    perte:                        { label: "Perte",               short: "Perte",     icon: AlertTriangle,   mod: "perte"                        },
    livraison:                    { label: "Livraison",           short: "Livraison", icon: Truck,           mod: "livraison"                    },
    annulation_perte:             { label: "Annulation perte",    short: "Annul.",    icon: Undo2,           mod: "annulation_perte"             },
    annulation_reapprovisionnement:{ label: "Annulation réappro.", short: "Annul.",   icon: Undo2,           mod: "annulation_reapprovisionnement" },
    archivage:                    { label: "Archivage",           short: "Archive",   icon: Archive,         mod: "archivage"                    },
    creation:                     { label: "Création produit",   short: "Création",  icon: PackagePlus,     mod: "creation"                     },
    modification:                 { label: "Modification",        short: "Modif.",    icon: Pencil,          mod: "modification"                 },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function formatDateShort(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
}

/* ─── TypeBadge ───────────────────────────────────────────────────────────────── */

function TypeBadge({ type, compact = false }) {
    const cfg  = TYPE_CONFIG[type] ?? TYPE_CONFIG.modification;
    const Icon = cfg.icon;
    return (
        <span className={`histTxn-typeBadge histTxn-typeBadge--${cfg.mod}`}>
            <Icon size={11} aria-hidden="true" />
            {compact ? cfg.short : cfg.label}
        </span>
    );
}

/* ─── TypeIcon ────────────────────────────────────────────────────────────────── */

function TypeIcon({ type }) {
    const cfg  = TYPE_CONFIG[type] ?? TYPE_CONFIG.modification;
    const Icon = cfg.icon;
    return (
        <span className={`histTxn-typeIcon histTxn-typeIcon--${cfg.mod}`} aria-hidden="true">
            <Icon size={16} />
        </span>
    );
}

/* ─── Variation ───────────────────────────────────────────────────────────────── */

function Variation({ v }) {
    if (v == null || v === 0) return <span className="histTxn-variation histTxn-variation--zero">—</span>;
    const isPlus = v > 0;
    return (
        <span className={`histTxn-variation histTxn-variation--${isPlus ? "plus" : "minus"}`}>
            {isPlus ? "+" : ""}{v}
        </span>
    );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────────── */

function SkeletonCard() {
    return (
        <div className="histTxn-skeleton-card" aria-hidden="true">
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(90deg, var(--color-surface-alt) 25%, var(--color-border) 50%, var(--color-surface-alt) 75%)",
                backgroundSize: "200% 100%", animation: "skeletonShimmer 1.4s ease-in-out infinite" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="skeleton-line skeleton-line--lg" />
                <div className="skeleton-line skeleton-line--sm" />
            </div>
            <div style={{ width: 36, height: 14, borderRadius: 4,
                background: "linear-gradient(90deg, var(--color-surface-alt) 25%, var(--color-border) 50%, var(--color-surface-alt) 75%)",
                backgroundSize: "200% 100%", animation: "skeletonShimmer 1.4s ease-in-out infinite" }} />
        </div>
    );
}

/* ─── Sort icon ───────────────────────────────────────────────────────────────── */

function SortIcon({ col, sortCol, sortDir }) {
    if (sortCol !== col) return <ChevronsUpDown size={14} className="histTxn-sort-icon" aria-hidden="true" />;
    return sortDir === "asc"
        ? <ChevronUp size={14} className="histTxn-sort-icon" aria-hidden="true" />
        : <ChevronDown size={14} className="histTxn-sort-icon" aria-hidden="true" />;
}

/* ─── Bottom Sheet Filtres ────────────────────────────────────────────────────── */

function BottomSheetFiltres({ filtres, onApply, onClose }) {
    const [local, setLocal] = useState(filtres);
    const ch = (k) => (e) => setLocal(p => ({ ...p, [k]: e.target.value }));

    return (
        <>
            <div className="histTxn-bs-overlay" onClick={onClose} aria-hidden="true" />
            <div className="histTxn-bs-panel" role="dialog" aria-modal="true" aria-labelledby="bs-title">
                <div className="histTxn-bs-handle" aria-hidden="true" />
                <div className="histTxn-bs-header">
                    <span id="bs-title" className="histTxn-bs-title">Filtres</span>
                    <button className="histTxn-bs-close" onClick={onClose} type="button" aria-label="Fermer">
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className="histTxn-bs-body">
                    <div className="histTxn-bs-field">
                        <label className="histTxn-bs-label" htmlFor="bs-debut">Date de début</label>
                        <input id="bs-debut" type="date" className="app-input" style={{ height: 44 }}
                            value={local.dateDebut} onChange={ch("dateDebut")} />
                    </div>
                    <div className="histTxn-bs-field">
                        <label className="histTxn-bs-label" htmlFor="bs-fin">Date de fin</label>
                        <input id="bs-fin" type="date" className="app-input" style={{ height: 44 }}
                            value={local.dateFin} onChange={ch("dateFin")} />
                    </div>
                    <div className="histTxn-bs-field">
                        <label className="histTxn-bs-label" htmlFor="bs-type-txn">Type de transaction</label>
                        <select id="bs-type-txn" className="app-input" style={{ height: 44, cursor: "pointer" }}
                            value={local.filtreType} onChange={ch("filtreType")} >
                            <option value="">Tous les types</option>
                            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="histTxn-bs-field">
                        <label className="histTxn-bs-label" htmlFor="bs-type-produit">Type de produit</label>
                        <select id="bs-type-produit" className="app-input" style={{ height: 44, cursor: "pointer" }}
                            value={local.filtreTypeProduit} onChange={ch("filtreTypeProduit")} >
                            <option value="">Tous</option>
                            <option value="physique">Physique</option>
                            <option value="service">Service</option>
                        </select>
                    </div>
                    <div className="histTxn-bs-field">
                        <label className="histTxn-bs-label" htmlFor="bs-cat">Catégorie</label>
                        <input id="bs-cat" type="text" className="app-input" placeholder="Ex : Papeterie"
                            value={local.filtreCategorie} onChange={ch("filtreCategorie")} />
                    </div>
                    <div className="histTxn-bs-field">
                        <label className="histTxn-bs-label" htmlFor="bs-user">Utilisateur</label>
                        <input id="bs-user" type="text" className="app-input" placeholder="Nom de l'utilisateur"
                            value={local.filtreUtilisateur} onChange={ch("filtreUtilisateur")} />
                    </div>
                </div>

                <div className="histTxn-bs-footer">
                    <button type="button" className="app-button app-button--ghost"
                        onClick={() => setLocal({ dateDebut: "", dateFin: "", filtreType: "", filtreTypeProduit: "", filtreCategorie: "", filtreUtilisateur: "" })}>
                        Réinitialiser
                    </button>
                    <button type="button" className="app-button app-button--primary"
                        onClick={() => { onApply(local); onClose(); }}>
                        Appliquer
                    </button>
                </div>
            </div>
        </>
    );
}

/* ─── Composant principal ─────────────────────────────────────────────────────── */

const DEFAULT_FILTRES = {
    dateDebut: "", dateFin: "", filtreType: "",
    filtreTypeProduit: "", filtreCategorie: "", filtreUtilisateur: "",
};

function HistoriqueTransactions() {
    const [transactions, setTransactions]       = useState([]);
    const [loading, setLoading]                 = useState(true);
    const [error, setError]                     = useState(null);

    /* Filtres */
    const [recherche, setRecherche]             = useState("");
    const [filtres, setFiltres]                 = useState(DEFAULT_FILTRES);
    const [showBottomSheet, setShowBottomSheet] = useState(false);

    /* Sort */
    const [sortCol, setSortCol]                 = useState("date");
    const [sortDir, setSortDir]                 = useState("desc");

    /* Pagination */
    const [page, setPage]                       = useState(1);
    const [limit, setLimit]                     = useState(25);

    /* Pane */
    const [selectedId, setSelectedId]           = useState(null);
    const [selectedTxn, setSelectedTxn]         = useState(null);
    const [paneLoading, setPaneLoading]         = useState(false);
    const [exporting, setExporting]             = useState(null);

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const payload = await fetchStockHistorique({ limit: 100 });
                if (!active) return;
                setTransactions(payload.items ?? []);
            } catch {
                if (active) {
                    setError("Impossible de charger les transactions.");
                }
            } finally {
                if (active) setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    /* Ouvrir pane avec chargement progressif */
    const openPane = useCallback((txn) => {
        setSelectedId(txn.id);
        setPaneLoading(true);
        setSelectedTxn(null);
        setTimeout(() => {
            setSelectedTxn(txn);
            setPaneLoading(false);
        }, 350);
    }, []);

    const closePane = useCallback(() => {
        setSelectedId(null);
        setSelectedTxn(null);
    }, []);

    /* Sort toggle */
    const toggleSort = useCallback((col) => {
        setSortDir(prev => sortCol === col ? (prev === "asc" ? "desc" : "asc") : "asc");
        setSortCol(col);
        setPage(1);
    }, [sortCol]);

    /* Compter filtres actifs */
    const nbFiltresActifs = Object.values(filtres).filter(Boolean).length;

    /* Filtrage + tri */
    const traites = useMemo(() => {
        const q = recherche.toLowerCase();
        const filtered = transactions.filter(txn => {
            const matchSearch =
                !q ||
                txn.produit.nom.toLowerCase().includes(q) ||
                txn.produit.reference.toLowerCase().includes(q) ||
                txn.utilisateur.nom.toLowerCase().includes(q);
            const matchType     = !filtres.filtreType         || txn.type === filtres.filtreType;
            const matchTypeProd = !filtres.filtreTypeProduit  || txn.produit.type_produit === filtres.filtreTypeProduit;
            const matchCat      = !filtres.filtreCategorie    || txn.produit.categorie.toLowerCase().includes(filtres.filtreCategorie.toLowerCase());
            const matchUser     = !filtres.filtreUtilisateur  || txn.utilisateur.nom.toLowerCase().includes(filtres.filtreUtilisateur.toLowerCase());
            const matchDebut    = !filtres.dateDebut           || new Date(txn.date) >= new Date(filtres.dateDebut);
            const matchFin      = !filtres.dateFin             || new Date(txn.date) <= new Date(filtres.dateFin + "T23:59:59");
            return matchSearch && matchType && matchTypeProd && matchCat && matchUser && matchDebut && matchFin;
        });

        return [...filtered].sort((a, b) => {
            let va, vb;
            switch (sortCol) {
                case "date":        va = new Date(a.date);                    vb = new Date(b.date);                    break;
                case "produit":     va = a.produit.nom.toLowerCase();         vb = b.produit.nom.toLowerCase();         break;
                case "variation":   va = a.variation ?? 0;                    vb = b.variation ?? 0;                    break;
                case "utilisateur": va = a.utilisateur.nom.toLowerCase();     vb = b.utilisateur.nom.toLowerCase();     break;
                case "categorie":   va = a.produit.categorie.toLowerCase();   vb = b.produit.categorie.toLowerCase();   break;
                default:            va = a.id; vb = b.id;
            }
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [transactions, recherche, filtres, sortCol, sortDir]);

    /* Pagination */
    const totalPages = Math.max(1, Math.ceil(traites.length / limit));
    const pageClamped = Math.min(page, totalPages);
    const paginated = traites.slice((pageClamped - 1) * limit, pageClamped * limit);

    const pagesVoisines = useMemo(() => {
        const pages = [];
        for (let i = Math.max(1, pageClamped - 2); i <= Math.min(totalPages, pageClamped + 2); i++) {
            pages.push(i);
        }
        return pages;
    }, [pageClamped, totalPages]);

    const resetFiltres = () => {
        setFiltres(DEFAULT_FILTRES);
        setRecherche("");
        setPage(1);
    };

    async function handleExport(fmt) {
        if (exporting) return;
        setExporting(fmt);
        try {
            await exportHistoriqueTransactions(fmt, {
                search: recherche,
                type: filtres.filtreType,
                dateDebut: filtres.dateDebut,
                dateFin: filtres.dateFin,
            });
        } catch { /* silencieux */ } finally {
            setExporting(null);
        }
    }

    return (
        <div className="histTxn-root">
            {/* Header */}
            <div className="histTxn-header">
                <h1 className="histTxn-header__title">Historique des transactions</h1>
                <p className="histTxn-header__subtitle">
                    Retrouvez toutes les modifications ayant affecté les stocks de l'entreprise.
                </p>
            </div>

            {/* ─── Toolbar mobile ─── */}
            <div className="histTxn-mobile-toolbar">
                <div className="histTxn-mobile-search" role="search">
                    <Search size={16} className="histTxn-mobile-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="histTxn-mobile-search__input app-input"
                        placeholder="Rechercher un produit, un utilisateur…"
                        aria-label="Rechercher"
                        value={recherche}
                        onChange={e => { setRecherche(e.target.value); setPage(1); }}
                    />
                </div>
                <button
                    className={`histTxn-filter-btn${showBottomSheet || nbFiltresActifs > 0 ? " histTxn-filter-btn--active" : ""}`}
                    onClick={() => setShowBottomSheet(true)}
                    type="button"
                    aria-label={`Filtres${nbFiltresActifs > 0 ? ` — ${nbFiltresActifs} actif(s)` : ""}`}
                >
                    <Filter size={16} aria-hidden="true" />
                    Filtrer
                    {nbFiltresActifs > 0 && (
                        <span style={{ background: "var(--color-primary)", color: "#fff", borderRadius: "50%",
                            width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 700, marginLeft: 2 }}>
                            {nbFiltresActifs}
                        </span>
                    )}
                </button>
            </div>

            {/* ─── Filtres desktop ─── */}
            <div className="histTxn-desktop-filters">
                <div className="histTxn-desktop-filters__row">
                    <div className="histTxn-search-wrap" role="search">
                        <Search size={16} className="histTxn-search-icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="histTxn-input"
                            placeholder="Rechercher un produit, un utilisateur ou une action…"
                            aria-label="Rechercher"
                            value={recherche}
                            onChange={e => { setRecherche(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="histTxn-field-group" style={{ minWidth: 160 }}>
                        <label className="histTxn-field-label" htmlFor="dt-type-txn">Type transaction</label>
                        <select id="dt-type-txn" className="histTxn-input" style={{ cursor: "pointer" }}
                            value={filtres.filtreType}
                            onChange={e => { setFiltres(p => ({ ...p, filtreType: e.target.value })); setPage(1); }}>
                            <option value="">Tous les types</option>
                            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="histTxn-field-group" style={{ minWidth: 130 }}>
                        <label className="histTxn-field-label" htmlFor="dt-cat">Catégorie</label>
                        <input id="dt-cat" type="text" className="histTxn-input" placeholder="Ex : Papeterie"
                            value={filtres.filtreCategorie}
                            onChange={e => { setFiltres(p => ({ ...p, filtreCategorie: e.target.value })); setPage(1); }} />
                    </div>
                    <div className="histTxn-field-group" style={{ minWidth: 120 }}>
                        <label className="histTxn-field-label" htmlFor="dt-type-prod">Type produit</label>
                        <select id="dt-type-prod" className="histTxn-input" style={{ cursor: "pointer" }}
                            value={filtres.filtreTypeProduit}
                            onChange={e => { setFiltres(p => ({ ...p, filtreTypeProduit: e.target.value })); setPage(1); }}>
                            <option value="">Tous</option>
                            <option value="physique">Physique</option>
                            <option value="service">Service</option>
                        </select>
                    </div>
                </div>

                <div className="histTxn-desktop-filters__row">
                    <div className="histTxn-field-group" style={{ minWidth: 130 }}>
                        <label className="histTxn-field-label" htmlFor="dt-debut">Date début</label>
                        <input id="dt-debut" type="date" className="histTxn-input"
                            value={filtres.dateDebut}
                            onChange={e => { setFiltres(p => ({ ...p, dateDebut: e.target.value })); setPage(1); }} />
                    </div>
                    <div className="histTxn-field-group" style={{ minWidth: 130 }}>
                        <label className="histTxn-field-label" htmlFor="dt-fin">Date fin</label>
                        <input id="dt-fin" type="date" className="histTxn-input"
                            value={filtres.dateFin}
                            onChange={e => { setFiltres(p => ({ ...p, dateFin: e.target.value })); setPage(1); }} />
                    </div>
                    <div className="histTxn-field-group" style={{ minWidth: 150 }}>
                        <label className="histTxn-field-label" htmlFor="dt-user">Utilisateur</label>
                        <input id="dt-user" type="text" className="histTxn-input" placeholder="Nom…"
                            value={filtres.filtreUtilisateur}
                            onChange={e => { setFiltres(p => ({ ...p, filtreUtilisateur: e.target.value })); setPage(1); }} />
                    </div>
                    {(nbFiltresActifs > 0 || recherche) && (
                        <button type="button" className="app-button app-button--ghost app-button--sm"
                            onClick={resetFiltres}
                            style={{ alignSelf: "flex-end" }}>
                            <X size={14} aria-hidden="true" />
                            Réinitialiser
                        </button>
                    )}

                    <div className="histTxn-exports" style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
                        {["CSV", "PDF", "DOCX"].map(fmt => {
                            const fmtLow = fmt.toLowerCase();
                            const busy   = exporting === fmtLow;
                            return (
                                <button key={fmt} type="button" className="histTxn-export-btn"
                                    aria-label={`Exporter en ${fmt}`}
                                    onClick={() => handleExport(fmtLow)}
                                    disabled={busy}>
                                    <FileText size={12} aria-hidden="true" />
                                    {busy ? "…" : fmt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ─── Layout principal ─── */}
            <div className="histTxn-layout">
                <div className="histTxn-main">

                    {/* Loading */}
                    {loading && (
                        <div className="histTxn-list" aria-busy="true" aria-label="Chargement">
                            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="histTxn-error" role="alert">
                            <AlertCircle size={36} aria-hidden="true" />
                            <p>{error}</p>
                            <button className="app-button app-button--ghost app-button--sm"
                                onClick={() => window.location.reload()} type="button">
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && traites.length === 0 && (
                        <div className="histTxn-empty">
                            <div className="histTxn-empty__icon">
                                <ClipboardList size={40} aria-hidden="true" />
                            </div>
                            <h3 className="histTxn-empty__title">Aucune transaction trouvée</h3>
                            <p className="histTxn-empty__text">
                                Ajustez vos critères de recherche ou réinitialisez les filtres.
                            </p>
                            <button type="button" className="app-button app-button--ghost" onClick={resetFiltres}>
                                Réinitialiser les filtres
                            </button>
                        </div>
                    )}

                    {!loading && !error && traites.length > 0 && (
                        <>
                            {/* ── Mobile : cartes ── */}
                            <ul className="histTxn-list" aria-label="Liste des transactions">
                                {paginated.map(txn => (
                                    <li key={txn.id}>
                                        <button
                                            className={`histTxn-card${selectedId === txn.id ? " histTxn-card--selected" : ""}`}
                                            onClick={() => selectedId === txn.id ? closePane() : openPane(txn)}
                                            type="button"
                                            aria-pressed={selectedId === txn.id}
                                            aria-label={`${TYPE_CONFIG[txn.type]?.label ?? txn.type} — ${txn.produit.nom}`}
                                        >
                                            <TypeIcon type={txn.type} />
                                            <div className="histTxn-card__body">
                                                <div className="histTxn-card__top">
                                                    <TypeBadge type={txn.type} compact />
                                                    <span className="histTxn-card__date">{formatDateShort(txn.date)}</span>
                                                </div>
                                                <span className="histTxn-card__produit">{txn.produit.nom}</span>
                                                <span className="histTxn-card__user">{txn.utilisateur.nom}</span>
                                            </div>
                                            <div className="histTxn-card__right">
                                                <Variation v={txn.variation} />
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {/* ── Desktop : tableau ── */}
                            <div className="histTxn-table-wrap">
                                <table className="histTxn-table" aria-label="Historique des transactions">
                                    <thead>
                                        <tr>
                                            {[
                                                { col: null,          label: "Type" },
                                                { col: "produit",     label: "Produit" },
                                                { col: "categorie",   label: "Catégorie" },
                                                { col: "utilisateur", label: "Utilisateur" },
                                                { col: "date",        label: "Date" },
                                                { col: "variation",   label: "Variation" },
                                                { col: null,          label: "Avant" },
                                                { col: null,          label: "Après" },
                                            ].map(({ col, label }, i) => (
                                                <th
                                                    key={i}
                                                    scope="col"
                                                    className={col ? `histTxn-th--sortable${sortCol === col ? " histTxn-th--sorted" : ""}` : ""}
                                                    onClick={col ? () => toggleSort(col) : undefined}
                                                    aria-sort={col && sortCol === col ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                                                >
                                                    <div className="histTxn-th-inner">
                                                        {label}
                                                        {col && <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.map(txn => (
                                            <tr
                                                key={txn.id}
                                                className={`histTxn-row${selectedId === txn.id ? " histTxn-row--selected" : ""}`}
                                                onClick={() => selectedId === txn.id ? closePane() : openPane(txn)}
                                                tabIndex={0}
                                                onKeyDown={e => e.key === "Enter" && (selectedId === txn.id ? closePane() : openPane(txn))}
                                                aria-selected={selectedId === txn.id}
                                            >
                                                <td>
                                                    <div className="histTxn-cell-type">
                                                        <TypeIcon type={txn.type} />
                                                        <TypeBadge type={txn.type} compact />
                                                    </div>
                                                </td>
                                                <td><span className="histTxn-cell-produit">{txn.produit.nom}</span></td>
                                                <td>{txn.produit.categorie}</td>
                                                <td>{txn.utilisateur.nom}</td>
                                                <td style={{ whiteSpace: "nowrap" }}>{formatDate(txn.date)}</td>
                                                <td><Variation v={txn.variation} /></td>
                                                <td style={{ color: "var(--color-text-muted)" }}>{txn.stock_avant ?? "—"}</td>
                                                <td style={{ color: "var(--color-text-muted)" }}>{txn.stock_apres ?? "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                <div className="histTxn-pagination">
                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                                        <span className="histTxn-pagination__info">
                                            {traites.length === 0 ? "0 résultat" : `${(pageClamped - 1) * limit + 1}–${Math.min(pageClamped * limit, traites.length)} sur ${traites.length}`}
                                        </span>
                                        <select
                                            className="histTxn-pagination__limit"
                                            value={limit}
                                            onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                                            aria-label="Éléments par page"
                                        >
                                            {[10, 25, 50, 100].map(n => (
                                                <option key={n} value={n}>{n} / page</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="histTxn-pagination__controls">
                                        <button type="button" className="histTxn-pagination__btn"
                                            onClick={() => setPage(1)} disabled={pageClamped === 1}
                                            aria-label="Première page">
                                            <ChevronLeft size={14} aria-hidden="true" />
                                            <ChevronLeft size={14} aria-hidden="true" style={{ marginLeft: -8 }} />
                                        </button>
                                        <button type="button" className="histTxn-pagination__btn"
                                            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageClamped === 1}
                                            aria-label="Page précédente">
                                            <ChevronLeft size={14} aria-hidden="true" />
                                        </button>

                                        {pagesVoisines.map(p => (
                                            <button key={p} type="button"
                                                className={`histTxn-pagination__btn${p === pageClamped ? " histTxn-pagination__btn--active" : ""}`}
                                                onClick={() => setPage(p)}
                                                aria-label={`Page ${p}`}
                                                aria-current={p === pageClamped ? "page" : undefined}>
                                                {p}
                                            </button>
                                        ))}

                                        <button type="button" className="histTxn-pagination__btn"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageClamped === totalPages}
                                            aria-label="Page suivante">
                                            <ChevronRight size={14} aria-hidden="true" />
                                        </button>
                                        <button type="button" className="histTxn-pagination__btn"
                                            onClick={() => setPage(totalPages)} disabled={pageClamped === totalPages}
                                            aria-label="Dernière page">
                                            <ChevronRight size={14} aria-hidden="true" />
                                            <ChevronRight size={14} aria-hidden="true" style={{ marginLeft: -8 }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Pane latéral ── */}
                {selectedId && (
                    <PaneDetailsTransaction
                        transaction={selectedTxn}
                        loading={paneLoading}
                        onClose={closePane}
                    />
                )}
            </div>

            {/* ── Bottom Sheet Mobile ── */}
            {showBottomSheet && (
                <BottomSheetFiltres
                    filtres={filtres}
                    onApply={(f) => { setFiltres(f); setPage(1); }}
                    onClose={() => setShowBottomSheet(false)}
                />
            )}
        </div>
    );
}

export default HistoriqueTransactions;
