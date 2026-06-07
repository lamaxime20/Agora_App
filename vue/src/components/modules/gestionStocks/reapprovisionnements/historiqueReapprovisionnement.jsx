import { useState, useEffect, useCallback } from "react";
import {
    Search, Filter, Download, AlertCircle, RefreshCw,
    Calendar, ChevronRight, CheckCircle2, X, Check,
} from "lucide-react";
import PaneDetailsReapprovisionnement    from "./paneDetailsReapprovisionnement.jsx";
import ModalAnnulerReapprovisionnement   from "./modalAnnulerReapprovisionnement.jsx";
import ModalConfirmerReapprovisionnement from "./modalConfirmerReapprovisionnement.jsx";
import { fetchStockRavitaillements } from "../../../../services/gestionStock.js";
import "../../../../assets/styles/components/modules/gestionStocks/historiqueReapprovisionnement.css";

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
    en_attente: { label: "En attente", mod: "warning" },
    en_cours:   { label: "En cours",   mod: "info"    },
    reçu:       { label: "Reçu",       mod: "success" },
    annulé:     { label: "Annulé",     mod: "error"   },
};

const STATUTS = ["", "en_attente", "en_cours", "reçu", "annulé"];

function peutAnnuler(statut)   { return statut === "en_attente" || statut === "en_cours"; }
function peutConfirmer(statut) { return statut === "en_cours"; }

function BadgeStatut({ statut }) {
    const cfg = STATUT_CONFIG[statut] ?? { label: statut, mod: "info" };
    return (
        <span className={`histReappro-badge histReappro-badge--${cfg.mod}`}>
            {cfg.label}
        </span>
    );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────────── */

function SkeletonRow() {
    return (
        <tr className="histReappro-table__row histReappro-table__row--skeleton" aria-hidden="true">
            {[60, 70, 55, 50, 60, 75].map((w, i) => (
                <td key={i}>
                    <div className="histReappro-skel__line" style={{ width: `${w}%` }} />
                </td>
            ))}
        </tr>
    );
}

function SkeletonCard() {
    return (
        <div className="histReappro-card histReappro-card--skeleton" aria-hidden="true">
            <div className="histReappro-skel__top">
                <div className="histReappro-skel__line histReappro-skel__line--lg" />
                <div className="histReappro-skel__badge" />
            </div>
            <div className="histReappro-skel__line histReappro-skel__line--md" />
        </div>
    );
}

/* ─── Composant ──────────────────────────────────────────────────────────────── */

function HistoriqueReapprovisionnement() {
    const [items, setItems]                   = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);
    const [recherche, setRecherche]           = useState("");
    const [filtreStatut, setFiltreStatut]     = useState("");
    const [dateDebut, setDateDebut]           = useState("");
    const [dateFin, setDateFin]               = useState("");
    const [showFilters, setShowFilters]       = useState(false);
    const [paneItem, setPaneItem]             = useState(null);
    const [itemAAnnuler, setItemAAnnuler]     = useState(null);
    const [itemAConfirmer, setItemAConfirmer] = useState(null);

    const handleAnnuler  = useCallback((e, item) => { e.stopPropagation(); setItemAAnnuler(item);  }, []);
    const handleConfirmer = useCallback((e, item) => { e.stopPropagation(); setItemAConfirmer(item); }, []);

    const charger = useCallback(() => {
        setLoading(true);
        setError(null);
        let active = true;

        (async () => {
            try {
                const payload = await fetchStockRavitaillements({ limit: 100 });
                if (!active) return;
                setItems(payload.items ?? []);
            } catch {
                if (active) {
                    setError("Impossible de charger l'historique.");
                }
            } finally {
                if (active) setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        return charger();
    }, [charger]);

    const itemsFiltres = items.filter(item => {
        const q = recherche.toLowerCase();
        const matchSearch = !recherche
            || item.reference.toLowerCase().includes(q)
            || item.fournisseur.toLowerCase().includes(q)
            || item.demandeur.nom.toLowerCase().includes(q);
        const matchStatut = !filtreStatut || item.statut === filtreStatut;
        return matchSearch && matchStatut;
    });

    const nbFiltresActifs = [filtreStatut, dateDebut, dateFin].filter(Boolean).length;

    return (
        <div className="histReappro-root">

            {/* ─── Toolbar ────────────────────────────────────────────── */}
            <div className="histReappro-toolbar">
                <div className="histReappro-search" role="search">
                    <Search size={15} className="histReappro-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="app-input histReappro-search__input"
                        placeholder="Rechercher une référence, fournisseur…"
                        aria-label="Rechercher dans l'historique"
                        value={recherche}
                        onChange={e => setRecherche(e.target.value)}
                    />
                </div>

                <div className="histReappro-toolbar__right">
                    <button
                        className={`app-button app-button--ghost app-button--sm histReappro-filter-btn${showFilters ? " histReappro-filter-btn--active" : ""}`}
                        onClick={() => setShowFilters(v => !v)}
                        type="button"
                        aria-expanded={showFilters}
                    >
                        <Filter size={14} aria-hidden="true" />
                        Filtres
                        {nbFiltresActifs > 0 && (
                            <span className="histReappro-filter-count">{nbFiltresActifs}</span>
                        )}
                    </button>

                    <div className="histReappro-exports">
                        {["PDF", "CSV", "DOCX"].map(fmt => (
                            <button
                                key={fmt}
                                className="app-button app-button--ghost app-button--sm histReappro-export-btn"
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

            {/* ─── Filtres avancés ────────────────────────────────────── */}
            {showFilters && (
                <div className="histReappro-filters">
                    <div className="histReappro-filter">
                        <label className="histReappro-filter__label" htmlFor="hist-date-debut">
                            <Calendar size={12} aria-hidden="true" /> Période du
                        </label>
                        <input
                            id="hist-date-debut"
                            type="date"
                            className="app-input histReappro-filter__input"
                            value={dateDebut}
                            onChange={e => setDateDebut(e.target.value)}
                        />
                    </div>
                    <div className="histReappro-filter">
                        <label className="histReappro-filter__label" htmlFor="hist-date-fin">
                            <Calendar size={12} aria-hidden="true" /> Au
                        </label>
                        <input
                            id="hist-date-fin"
                            type="date"
                            className="app-input histReappro-filter__input"
                            value={dateFin}
                            onChange={e => setDateFin(e.target.value)}
                        />
                    </div>
                    <div className="histReappro-filter">
                        <label className="histReappro-filter__label" htmlFor="hist-statut">
                            Statut
                        </label>
                        <select
                            id="hist-statut"
                            className="app-input histReappro-filter__input"
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
                            className="app-button app-button--ghost app-button--sm histReappro-reset"
                            onClick={() => {
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

            {/* ─── Chargement ─────────────────────────────────────────── */}
            {loading && (
                <>
                    <div className="histReappro-cards">
                        {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                    <div className="histReappro-table-wrap">
                        <table className="histReappro-table">
                            <thead>
                                <tr>
                                    {["Référence", "Fournisseur", "Montant", "Créateur", "Date", "Statut"].map(h => (
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

            {/* ─── Erreur ──────────────────────────────────────────────── */}
            {!loading && error && (
                <div className="histReappro-error" role="alert">
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
                <div className="histReappro-empty">
                    <CheckCircle2 size={36} aria-hidden="true" />
                    <p>Aucun résultat pour ces filtres.</p>
                </div>
            )}

            {/* ─── Mobile : cartes ─────────────────────────────────────── */}
            {!loading && !error && itemsFiltres.length > 0 && (
                <ul className="histReappro-cards" aria-label="Historique des réapprovisionnements">
                    {itemsFiltres.map(item => (
                        <li key={item.id}>
                            <button
                                className="histReappro-card"
                                onClick={() => setPaneItem(item)}
                                type="button"
                            >
                                <div className="histReappro-card__top">
                                    <span className="histReappro-card__ref">{item.reference}</span>
                                    <BadgeStatut statut={item.statut} />
                                </div>
                                <div className="histReappro-card__meta">
                                    <span>{item.fournisseur}</span>
                                    <span>{formatDate(item.date_demande)}</span>
                                </div>
                                <span className="histReappro-card__montant">
                                    {formatMontant(item.montant_total)}
                                </span>
                                {(peutAnnuler(item.statut) || peutConfirmer(item.statut)) && (
                                    <div className="histReappro-card__actions" onClick={e => e.stopPropagation()}>
                                        {peutAnnuler(item.statut) && (
                                            <button
                                                className="app-button app-button--ghost app-button--sm histReappro-btn--danger"
                                                onClick={e => handleAnnuler(e, item)}
                                                type="button"
                                            >
                                                <X size={14} aria-hidden="true" />
                                                Annuler
                                            </button>
                                        )}
                                        {peutConfirmer(item.statut) && (
                                            <button
                                                className="app-button app-button--primary app-button--sm"
                                                onClick={e => handleConfirmer(e, item)}
                                                type="button"
                                            >
                                                <Check size={14} aria-hidden="true" />
                                                Confirmer
                                            </button>
                                        )}
                                    </div>
                                )}
                                <ChevronRight size={14} className="histReappro-card__arrow" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* ─── Desktop : tableau ───────────────────────────────────── */}
            {!loading && !error && itemsFiltres.length > 0 && (
                <div className="histReappro-table-wrap">
                    <table className="histReappro-table" aria-label="Historique des réapprovisionnements">
                        <thead>
                            <tr>
                                <th scope="col">Référence</th>
                                <th scope="col">Fournisseur</th>
                                <th scope="col">Montant</th>
                                <th scope="col">Créateur</th>
                                <th scope="col">Date demande</th>
                                <th scope="col">Statut</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsFiltres.map(item => (
                                <tr
                                    key={item.id}
                                    className="histReappro-table__row"
                                    onClick={() => setPaneItem(item)}
                                >
                                    <td>
                                        <span className="histReappro-table__ref">{item.reference}</span>
                                    </td>
                                    <td className="histReappro-table__fournisseur">{item.fournisseur}</td>
                                    <td className="histReappro-table__montant">
                                        {formatMontant(item.montant_total)}
                                    </td>
                                    <td>{item.demandeur.nom}</td>
                                    <td className="histReappro-table__date">{formatDate(item.date_demande)}</td>
                                    <td><BadgeStatut statut={item.statut} /></td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div className="histReappro-table__actions">
                                            {peutAnnuler(item.statut) && (
                                                <button
                                                    className="app-button app-button--ghost app-button--sm histReappro-btn--danger"
                                                    onClick={e => handleAnnuler(e, item)}
                                                    type="button"
                                                >
                                                    <X size={12} aria-hidden="true" />
                                                    Annuler
                                                </button>
                                            )}
                                            {peutConfirmer(item.statut) && (
                                                <button
                                                    className="app-button app-button--primary app-button--sm"
                                                    onClick={e => handleConfirmer(e, item)}
                                                    type="button"
                                                >
                                                    <Check size={12} aria-hidden="true" />
                                                    Confirmer
                                                </button>
                                            )}
                                            {!peutAnnuler(item.statut) && !peutConfirmer(item.statut) && (
                                                <span className="histReappro-table__no-action">—</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── Résultats ───────────────────────────────────────────── */}
            {!loading && !error && (
                <p className="histReappro-results">
                    {itemsFiltres.length} résultat{itemsFiltres.length > 1 ? "s" : ""}
                    {nbFiltresActifs > 0 && " (filtré)"}
                </p>
            )}

            {/* ─── Pane ────────────────────────────────────────────────── */}
            {paneItem && (
                <PaneDetailsReapprovisionnement
                    item={paneItem}
                    onClose={() => setPaneItem(null)}
                    onAnnuler={(item) => { setPaneItem(null); setItemAAnnuler(item); }}
                    onConfirmer={(item) => { setPaneItem(null); setItemAConfirmer(item); }}
                />
            )}

            {/* ─── Modals ──────────────────────────────────────────────── */}
            {itemAAnnuler && (
                <ModalAnnulerReapprovisionnement
                    item={itemAAnnuler}
                    onClose={() => setItemAAnnuler(null)}
                    onSaved={() => { setItemAAnnuler(null); charger(); }}
                />
            )}
            {itemAConfirmer && (
                <ModalConfirmerReapprovisionnement
                    item={itemAConfirmer}
                    onClose={() => setItemAConfirmer(null)}
                    onSaved={() => { setItemAConfirmer(null); charger(); }}
                />
            )}
        </div>
    );
}

export default HistoriqueReapprovisionnement;
