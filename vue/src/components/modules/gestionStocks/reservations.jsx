import { useState, useEffect, useCallback } from "react";
import {
    ShoppingCart, AlertCircle, RefreshCw, Search,
    Download, Filter, ChevronRight, Calendar,
} from "lucide-react";
import reservationsData from "../../../mockups/gestionStocks/reservations.json";
import PaneDetailsReservation from "./reservations/paneDetailsReservation.jsx";
import "../../../assets/styles/components/modules/gestionStocks/reservations.css";

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function formatMontant(n) {
    return n?.toLocaleString("fr-FR") + " FCFA";
}

const STATUT_CONFIG = {
    en_cours: { label: "En cours", mod: "warning" },
    validé:   { label: "Validé",   mod: "success" },
    annulé:   { label: "Annulé",   mod: "error"   },
};

const STATUTS = ["", "en_cours", "validé", "annulé"];

function BadgeStatut({ statut }) {
    const cfg = STATUT_CONFIG[statut] ?? { label: statut, mod: "info" };
    return (
        <span className={`reservations-badge reservations-badge--${cfg.mod}`}>
            {cfg.label}
        </span>
    );
}

/* ─── KPI Card ────────────────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, mod }) {
    return (
        <div className={`reservations-kpi${mod ? ` reservations-kpi--${mod}` : ""}`}>
            <p className="reservations-kpi__value">{value}</p>
            <p className="reservations-kpi__label">{label}</p>
            {sub && <p className="reservations-kpi__sub">{sub}</p>}
        </div>
    );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────────── */

function SkeletonCard() {
    return (
        <div className="reservations-card reservations-card--skeleton" aria-hidden="true">
            <div className="reservations-skel__top">
                <div className="reservations-skel__line reservations-skel__line--lg" />
                <div className="reservations-skel__badge" />
            </div>
            <div className="reservations-skel__line reservations-skel__line--md" />
            <div className="reservations-skel__line reservations-skel__line--sm" />
        </div>
    );
}

function SkeletonRow() {
    return (
        <tr className="reservations-table__row reservations-table__row--skeleton" aria-hidden="true">
            {[65, 55, 70, 55, 60, 75].map((w, i) => (
                <td key={i}>
                    <div className="reservations-skel__line" style={{ width: `${w}%` }} />
                </td>
            ))}
        </tr>
    );
}

/* ─── Composant principal ─────────────────────────────────────────────────────── */

function Reservations() {
    const [items, setItems]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [recherche, setRecherche]       = useState("");
    const [filtreStatut, setFiltreStatut] = useState("");
    const [showFilters, setShowFilters]   = useState(false);
    const [paneItem, setPaneItem]         = useState(null);

    const charger = useCallback(() => {
        setLoading(true);
        setError(null);
        const t = setTimeout(() => {
            try {
                setItems(reservationsData.data.reservations);
            } catch {
                setError("Impossible de charger les réservations.");
            }
            setLoading(false);
        }, 700);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        return charger();
    }, [charger]);

    const itemsFiltres = items.filter(item => {
        const q = recherche.toLowerCase();
        const matchSearch = !recherche
            || item.reference.toLowerCase().includes(q)
            || item.client.nom.toLowerCase().includes(q)
            || item.lignes.some(l => l.nom.toLowerCase().includes(q));
        const matchStatut = !filtreStatut || item.statut === filtreStatut;
        return matchSearch && matchStatut;
    });

    const actives       = items.filter(i => i.statut === "en_cours");
    const articlesTotal = actives.reduce((acc, i) => acc + i.lignes.reduce((a, l) => a + l.quantite_reservee, 0), 0);
    const valeurTotal   = actives.reduce((acc, i) => acc + i.montant_total, 0);
    const nbFiltresActifs = [filtreStatut].filter(Boolean).length;

    return (
        <div className="reservations-root">

            {/* ─── En-tête ────────────────────────────────────────────── */}
            <div className="reservations-header">
                <div>
                    <h2 className="reservations-header__title">Réservations</h2>
                    <p className="reservations-header__sub">
                        Produits actuellement réservés par les commandes
                    </p>
                </div>
            </div>

            {/* ─── KPI cards ──────────────────────────────────────────── */}
            {!loading && !error && (
                <div className="reservations-kpis">
                    <KpiCard
                        label="Réservations actives"
                        value={actives.length}
                        mod="primary"
                    />
                    <KpiCard
                        label="Articles réservés"
                        value={articlesTotal}
                        sub="en cours uniquement"
                    />
                    <KpiCard
                        label="Valeur réservée"
                        value={formatMontant(valeurTotal)}
                        mod="success"
                    />
                </div>
            )}

            {/* ─── Toolbar ────────────────────────────────────────────── */}
            <div className="reservations-toolbar">
                <div className="reservations-search" role="search">
                    <Search size={15} className="reservations-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="app-input reservations-search__input"
                        placeholder="Rechercher une commande, un client…"
                        aria-label="Rechercher une réservation"
                        value={recherche}
                        onChange={e => setRecherche(e.target.value)}
                    />
                </div>
                <div className="reservations-toolbar__right">
                    <button
                        className={`app-button app-button--ghost app-button--sm${showFilters ? " reservations-filter-btn--active" : ""}`}
                        onClick={() => setShowFilters(v => !v)}
                        type="button"
                        aria-expanded={showFilters}
                    >
                        <Filter size={14} aria-hidden="true" />
                        Filtres
                        {nbFiltresActifs > 0 && (
                            <span className="reservations-filter-count">{nbFiltresActifs}</span>
                        )}
                    </button>
                    <div className="reservations-exports">
                        {["PDF", "CSV", "DOCX"].map(fmt => (
                            <button
                                key={fmt}
                                className="app-button app-button--ghost app-button--sm reservations-export-btn"
                                type="button"
                                aria-label={`Exporter en ${fmt}`}
                            >
                                <Download size={13} aria-hidden="true" />
                                {fmt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Filtres ────────────────────────────────────────────── */}
            {showFilters && (
                <div className="reservations-filters">
                    <div className="reservations-filter">
                        <label className="reservations-filter__label" htmlFor="res-date-debut">
                            <Calendar size={12} aria-hidden="true" /> Période du
                        </label>
                        <input
                            id="res-date-debut"
                            type="date"
                            className="app-input reservations-filter__input"
                        />
                    </div>
                    <div className="reservations-filter">
                        <label className="reservations-filter__label" htmlFor="res-date-fin">
                            <Calendar size={12} aria-hidden="true" /> Au
                        </label>
                        <input
                            id="res-date-fin"
                            type="date"
                            className="app-input reservations-filter__input"
                        />
                    </div>
                    <div className="reservations-filter">
                        <label className="reservations-filter__label" htmlFor="res-statut">
                            Statut
                        </label>
                        <select
                            id="res-statut"
                            className="app-input reservations-filter__input"
                            value={filtreStatut}
                            onChange={e => setFiltreStatut(e.target.value)}
                        >
                            {STATUTS.map(s => (
                                <option key={s} value={s}>
                                    {s === "" ? "Tous les statuts" : STATUT_CONFIG[s]?.label ?? s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* ─── Chargement ─────────────────────────────────────────── */}
            {loading && (
                <>
                    <div className="reservations-cards">
                        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                    <div className="reservations-table-wrap">
                        <table className="reservations-table">
                            <thead>
                                <tr>
                                    {["Commande", "Client", "Produit(s)", "Montant", "Date", "Statut"].map(h => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ─── Erreur ──────────────────────────────────────────────── */}
            {!loading && error && (
                <div className="reservations-error" role="alert">
                    <AlertCircle size={28} aria-hidden="true" />
                    <p>{error}</p>
                    <button
                        className="app-button app-button--ghost app-button--sm"
                        onClick={charger}
                        type="button"
                    >
                        <RefreshCw size={13} aria-hidden="true" />
                        Réessayer
                    </button>
                </div>
            )}

            {/* ─── Vide ────────────────────────────────────────────────── */}
            {!loading && !error && itemsFiltres.length === 0 && (
                <div className="reservations-empty">
                    <div className="reservations-empty__icon">
                        <ShoppingCart size={36} aria-hidden="true" />
                    </div>
                    <h3 className="reservations-empty__title">Aucune réservation</h3>
                    <p className="reservations-empty__text">
                        Aucune commande avec réservation de stock ne correspond aux filtres.
                    </p>
                </div>
            )}

            {/* ─── Mobile : cartes ─────────────────────────────────────── */}
            {!loading && !error && itemsFiltres.length > 0 && (
                <ul className="reservations-cards" aria-label="Liste des réservations">
                    {itemsFiltres.map(item => (
                        <li key={item.id}>
                            <button
                                className="reservations-card"
                                onClick={() => setPaneItem(item)}
                                type="button"
                            >
                                <div className="reservations-card__top">
                                    <span className="reservations-card__ref">{item.reference}</span>
                                    <BadgeStatut statut={item.statut} />
                                </div>
                                <span className="reservations-card__client">{item.client.nom}</span>
                                <div className="reservations-card__meta">
                                    <span>{item.lignes.length} article{item.lignes.length > 1 ? "s" : ""}</span>
                                    <span>{formatMontant(item.montant_total)}</span>
                                    <span>{formatDate(item.date_reservation)}</span>
                                </div>
                                <ChevronRight size={14} className="reservations-card__arrow" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* ─── Desktop : tableau ───────────────────────────────────── */}
            {!loading && !error && itemsFiltres.length > 0 && (
                <div className="reservations-table-wrap">
                    <table className="reservations-table" aria-label="Liste des réservations">
                        <thead>
                            <tr>
                                <th scope="col">Commande</th>
                                <th scope="col">Client</th>
                                <th scope="col">Articles</th>
                                <th scope="col">Montant</th>
                                <th scope="col">Date réservation</th>
                                <th scope="col">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsFiltres.map(item => (
                                <tr
                                    key={item.id}
                                    className="reservations-table__row"
                                    onClick={() => setPaneItem(item)}
                                >
                                    <td>
                                        <span className="reservations-table__ref">{item.reference}</span>
                                    </td>
                                    <td className="reservations-table__client">{item.client.nom}</td>
                                    <td>
                                        <span className="reservations-table__articles">
                                            {item.lignes.length} article{item.lignes.length > 1 ? "s" : ""}
                                        </span>
                                    </td>
                                    <td className="reservations-table__montant">
                                        {formatMontant(item.montant_total)}
                                    </td>
                                    <td className="reservations-table__date">
                                        {formatDate(item.date_reservation)}
                                    </td>
                                    <td><BadgeStatut statut={item.statut} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── Résultats ───────────────────────────────────────────── */}
            {!loading && !error && (
                <p className="reservations-results">
                    {itemsFiltres.length} réservation{itemsFiltres.length > 1 ? "s" : ""}
                </p>
            )}

            {/* ─── Pane ────────────────────────────────────────────────── */}
            {paneItem && (
                <PaneDetailsReservation
                    item={paneItem}
                    onClose={() => setPaneItem(null)}
                />
            )}
        </div>
    );
}

export default Reservations;
