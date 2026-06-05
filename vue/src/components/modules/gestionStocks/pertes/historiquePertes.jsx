import { useState, useEffect, useCallback } from "react";
import {
    Search, Filter, Download, AlertCircle, RefreshCw,
    Calendar, ChevronRight, X,
} from "lucide-react";
import pertesData from "../../../../mockups/gestionStocks/pertes.json";
import PaneDetailsPerte    from "./paneDetailsPerte.jsx";
import ModalAnnulerPerte   from "./modalAnnulerPerte.jsx";
import "../../../../assets/styles/components/modules/gestionStocks/historiquePertes.css";

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

const MOTIF_CONFIG = {
    vol:        { label: "Vol",        mod: "error"   },
    casse:      { label: "Casse",      mod: "warning" },
    péremption: { label: "Péremption", mod: "info"    },
    autre:      { label: "Autre",      mod: "muted"   },
};

const STATUT_CONFIG = {
    confirmée: { label: "Confirmée", mod: "error"   },
    annulée:   { label: "Annulée",   mod: "success" },
};

const MOTIFS  = ["", "vol", "casse", "péremption", "autre"];
const STATUTS = ["", "confirmée", "annulée"];

function peutAnnuler(item) {
    if (item.statut === "annulée") return false;
    return new Date(item.date_limite_annulation).getTime() > Date.now();
}

function BadgeMotif({ motif }) {
    const cfg = MOTIF_CONFIG[motif] ?? { label: motif, mod: "muted" };
    return (
        <span className={`histPertes-badge histPertes-badge--${cfg.mod}`}>
            {cfg.label}
        </span>
    );
}

function BadgeStatut({ statut }) {
    const cfg = STATUT_CONFIG[statut] ?? { label: statut, mod: "muted" };
    return (
        <span className={`histPertes-badge histPertes-badge--${cfg.mod}`}>
            {cfg.label}
        </span>
    );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────────── */

function SkeletonCard() {
    return (
        <div className="histPertes-card histPertes-card--skeleton" aria-hidden="true">
            <div className="histPertes-skel__top">
                <div className="histPertes-skel__line histPertes-skel__line--lg" />
                <div className="histPertes-skel__badge" />
            </div>
            <div className="histPertes-skel__line histPertes-skel__line--md" />
        </div>
    );
}

function SkeletonRow() {
    return (
        <tr className="histPertes-table__row histPertes-table__row--skeleton" aria-hidden="true">
            {[60, 65, 45, 50, 55, 70].map((w, i) => (
                <td key={i}>
                    <div className="histPertes-skel__line" style={{ width: `${w}%` }} />
                </td>
            ))}
        </tr>
    );
}

/* ─── Composant ──────────────────────────────────────────────────────────────── */

function HistoriquePertes() {
    const [items, setItems]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [recherche, setRecherche]       = useState("");
    const [filtreMotif, setFiltreMotif]   = useState("");
    const [filtreStatut, setFiltreStatut] = useState("");
    const [dateDebut, setDateDebut]       = useState("");
    const [dateFin, setDateFin]           = useState("");
    const [showFilters, setShowFilters]   = useState(false);
    const [paneItem, setPaneItem]         = useState(null);
    const [itemAAnnuler, setItemAAnnuler] = useState(null);

    const handleAnnuler = useCallback((e, item) => { e.stopPropagation(); setItemAAnnuler(item); }, []);

    const charger = useCallback(() => {
        setLoading(true);
        setError(null);
        const t = setTimeout(() => {
            try {
                setItems(pertesData.data.pertes);
            } catch {
                setError("Impossible de charger l'historique.");
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
            || item.produit.nom.toLowerCase().includes(q)
            || item.declarant.nom.toLowerCase().includes(q);
        const matchMotif  = !filtreMotif  || item.motif   === filtreMotif;
        const matchStatut = !filtreStatut || item.statut  === filtreStatut;
        return matchSearch && matchMotif && matchStatut;
    });

    const nbFiltresActifs = [filtreMotif, filtreStatut, dateDebut, dateFin].filter(Boolean).length;

    return (
        <div className="histPertes-root">

            {/* ─── Toolbar ────────────────────────────────────────── */}
            <div className="histPertes-toolbar">
                <div className="histPertes-search" role="search">
                    <Search size={15} className="histPertes-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="app-input histPertes-search__input"
                        placeholder="Rechercher une perte, un produit, un responsable…"
                        aria-label="Rechercher dans l'historique des pertes"
                        value={recherche}
                        onChange={e => setRecherche(e.target.value)}
                    />
                </div>

                <div className="histPertes-toolbar__right">
                    <button
                        className={`app-button app-button--ghost app-button--sm${showFilters ? " histPertes-filter-btn--active" : ""}`}
                        onClick={() => setShowFilters(v => !v)}
                        type="button"
                        aria-expanded={showFilters}
                    >
                        <Filter size={14} aria-hidden="true" />
                        Filtres
                        {nbFiltresActifs > 0 && (
                            <span className="histPertes-filter-count">{nbFiltresActifs}</span>
                        )}
                    </button>
                    <div className="histPertes-exports">
                        {["PDF", "CSV", "DOCX"].map(fmt => (
                            <button
                                key={fmt}
                                className="app-button app-button--ghost app-button--sm histPertes-export-btn"
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

            {/* ─── Filtres ────────────────────────────────────────── */}
            {showFilters && (
                <div className="histPertes-filters">
                    <div className="histPertes-filter">
                        <label className="histPertes-filter__label" htmlFor="hist-p-debut">
                            <Calendar size={11} aria-hidden="true" /> Période du
                        </label>
                        <input
                            id="hist-p-debut"
                            type="date"
                            className="app-input histPertes-filter__input"
                            value={dateDebut}
                            onChange={e => setDateDebut(e.target.value)}
                        />
                    </div>
                    <div className="histPertes-filter">
                        <label className="histPertes-filter__label" htmlFor="hist-p-fin">
                            <Calendar size={11} aria-hidden="true" /> Au
                        </label>
                        <input
                            id="hist-p-fin"
                            type="date"
                            className="app-input histPertes-filter__input"
                            value={dateFin}
                            onChange={e => setDateFin(e.target.value)}
                        />
                    </div>
                    <div className="histPertes-filter">
                        <label className="histPertes-filter__label" htmlFor="hist-motif">Motif</label>
                        <select
                            id="hist-motif"
                            className="app-input histPertes-filter__input"
                            value={filtreMotif}
                            onChange={e => setFiltreMotif(e.target.value)}
                        >
                            {MOTIFS.map(m => (
                                <option key={m} value={m}>
                                    {m === "" ? "Tous les motifs" : MOTIF_CONFIG[m]?.label ?? m}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="histPertes-filter">
                        <label className="histPertes-filter__label" htmlFor="hist-statut">Statut</label>
                        <select
                            id="hist-statut"
                            className="app-input histPertes-filter__input"
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
                    {nbFiltresActifs > 0 && (
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => {
                                setFiltreMotif("");
                                setFiltreStatut("");
                                setDateDebut("");
                                setDateFin("");
                            }}
                            type="button"
                        >
                            Réinitialiser
                        </button>
                    )}
                </div>
            )}

            {/* ─── Chargement ─────────────────────────────────────── */}
            {loading && (
                <>
                    <div className="histPertes-cards">
                        {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                    <div className="histPertes-table-wrap">
                        <table className="histPertes-table">
                            <thead>
                                <tr>
                                    {["Référence", "Produit", "Quantité", "Valeur", "Déclaré par", "Date"].map(h => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ─── Erreur ──────────────────────────────────────────── */}
            {!loading && error && (
                <div className="histPertes-error" role="alert">
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

            {/* ─── Vide ────────────────────────────────────────────── */}
            {!loading && !error && itemsFiltres.length === 0 && (
                <div className="histPertes-empty">
                    <p>Aucune perte ne correspond aux filtres.</p>
                </div>
            )}

            {/* ─── Mobile : cartes ─────────────────────────────────── */}
            {!loading && !error && itemsFiltres.length > 0 && (
                <ul className="histPertes-cards" aria-label="Historique des pertes">
                    {itemsFiltres.map(item => (
                        <li key={item.id}>
                            <button
                                className="histPertes-card"
                                onClick={() => setPaneItem(item)}
                                type="button"
                            >
                                <div className="histPertes-card__top">
                                    <span className="histPertes-card__ref">{item.reference}</span>
                                    <BadgeMotif motif={item.motif} />
                                </div>
                                <div className="histPertes-card__meta">
                                    <span>{item.produit.nom}</span>
                                    <span>{formatDate(item.date_declaration)}</span>
                                </div>
                                <div className="histPertes-card__bottom">
                                    <span className="histPertes-card__valeur">
                                        {formatMontant(item.valeur_totale)}
                                    </span>
                                    <BadgeStatut statut={item.statut} />
                                </div>
                                {peutAnnuler(item) && (
                                    <div className="histPertes-card__actions" onClick={e => e.stopPropagation()}>
                                        <button
                                            className="app-button app-button--ghost app-button--sm histPertes-btn--danger"
                                            onClick={e => handleAnnuler(e, item)}
                                            type="button"
                                        >
                                            <X size={14} aria-hidden="true" />
                                            Annuler la perte
                                        </button>
                                    </div>
                                )}
                                <ChevronRight size={14} className="histPertes-card__arrow" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* ─── Desktop : tableau ───────────────────────────────── */}
            {!loading && !error && itemsFiltres.length > 0 && (
                <div className="histPertes-table-wrap">
                    <table className="histPertes-table" aria-label="Historique des pertes">
                        <thead>
                            <tr>
                                <th scope="col">Référence</th>
                                <th scope="col">Produit</th>
                                <th scope="col">Quantité</th>
                                <th scope="col">Valeur</th>
                                <th scope="col">Déclaré par</th>
                                <th scope="col">Date</th>
                                <th scope="col">Motif</th>
                                <th scope="col">Statut</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsFiltres.map(item => (
                                <tr
                                    key={item.id}
                                    className="histPertes-table__row"
                                    onClick={() => setPaneItem(item)}
                                >
                                    <td>
                                        <span className="histPertes-table__ref">{item.reference}</span>
                                    </td>
                                    <td className="histPertes-table__produit">{item.produit.nom}</td>
                                    <td>
                                        {item.quantite} {item.produit.unite}{item.quantite > 1 ? "s" : ""}
                                    </td>
                                    <td className="histPertes-table__valeur">
                                        {formatMontant(item.valeur_totale)}
                                    </td>
                                    <td>{item.declarant.nom}</td>
                                    <td className="histPertes-table__date">
                                        {formatDate(item.date_declaration)}
                                    </td>
                                    <td><BadgeMotif motif={item.motif} /></td>
                                    <td><BadgeStatut statut={item.statut} /></td>
                                    <td onClick={e => e.stopPropagation()}>
                                        {peutAnnuler(item) ? (
                                            <button
                                                className="app-button app-button--ghost app-button--sm histPertes-btn--danger"
                                                onClick={e => handleAnnuler(e, item)}
                                                type="button"
                                            >
                                                <X size={12} aria-hidden="true" />
                                                Annuler
                                            </button>
                                        ) : (
                                            <span className="histPertes-table__no-action">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── Résultats ───────────────────────────────────────── */}
            {!loading && !error && (
                <p className="histPertes-results">
                    {itemsFiltres.length} perte{itemsFiltres.length > 1 ? "s" : ""}
                    {nbFiltresActifs > 0 && " (filtrée)"}
                </p>
            )}

            {/* ─── Pane ────────────────────────────────────────────── */}
            {paneItem && (
                <PaneDetailsPerte
                    item={paneItem}
                    onClose={() => setPaneItem(null)}
                    onAnnuler={(item) => { setPaneItem(null); setItemAAnnuler(item); }}
                    peutAnnuler={peutAnnuler(paneItem)}
                />
            )}

            {/* ─── Modal annulation ────────────────────────────────── */}
            {itemAAnnuler && (
                <ModalAnnulerPerte
                    item={itemAAnnuler}
                    onClose={() => setItemAAnnuler(null)}
                    onConfirm={() => { setItemAAnnuler(null); charger(); }}
                />
            )}
        </div>
    );
}

export default HistoriquePertes;
