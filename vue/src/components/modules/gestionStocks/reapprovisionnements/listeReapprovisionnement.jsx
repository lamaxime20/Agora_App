import { useState, useEffect, useCallback } from "react";
import {
    Plus, RefreshCw, AlertCircle, Package2,
    ChevronRight, Check, X, Clock, CheckCircle2,
} from "lucide-react";
import reapproData from "../../../../mockups/gestionStocks/reapprovisionnements.json";
import ModalCreationReapprovisionnement  from "./modalCreationReapprovisionnement.jsx";
import ModalAnnulerReapprovisionnement   from "./modalAnnulerReapprovisionnement.jsx";
import ModalConfirmerReapprovisionnement from "./modalConfirmerReapprovisionnement.jsx";
import PaneDetailsReapprovisionnement    from "./paneDetailsReapprovisionnement.jsx";
import "../../../../assets/styles/components/modules/gestionStocks/listeReapprovisionnement.css";

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
    en_attente: { label: "En attente", mod: "warning", Icon: Clock        },
    en_cours:   { label: "En cours",   mod: "info",    Icon: RefreshCw    },
    reçu:       { label: "Reçu",       mod: "success", Icon: CheckCircle2 },
    annulé:     { label: "Annulé",     mod: "error",   Icon: X            },
};

function BadgeStatut({ statut }) {
    const cfg = STATUT_CONFIG[statut] ?? { label: statut, mod: "info", Icon: Clock };
    const { label, mod } = cfg;
    return (
        <span className={`listeReappro-badge listeReappro-badge--${mod}`}>
            {label}
        </span>
    );
}

function peutAnnuler(statut)   { return statut === "en_attente" || statut === "en_cours"; }
function peutConfirmer(statut) { return statut === "en_cours"; }

/* ─── Skeleton ────────────────────────────────────────────────────────────────── */

function SkeletonCard() {
    return (
        <div className="listeReappro-card listeReappro-card--skeleton" aria-hidden="true">
            <div className="listeReappro-skeleton__top">
                <div className="listeReappro-skeleton__line listeReappro-skeleton__line--lg" />
                <div className="listeReappro-skeleton__badge" />
            </div>
            <div className="listeReappro-skeleton__line listeReappro-skeleton__line--md" />
            <div className="listeReappro-skeleton__line listeReappro-skeleton__line--sm" />
        </div>
    );
}

function SkeletonRow() {
    return (
        <tr className="listeReappro-table__row listeReappro-table__row--skeleton" aria-hidden="true">
            {[70, 55, 60, 50, 55, 75, 80].map((w, i) => (
                <td key={i}>
                    <div
                        className="listeReappro-skeleton__line"
                        style={{ width: `${w}%` }}
                    />
                </td>
            ))}
        </tr>
    );
}

/* ─── Empty state ─────────────────────────────────────────────────────────────── */

function EmptyState({ onAdd }) {
    return (
        <div className="listeReappro-empty">
            <div className="listeReappro-empty__icon">
                <Package2 size={40} aria-hidden="true" />
            </div>
            <h3 className="listeReappro-empty__title">Aucun réapprovisionnement</h3>
            <p className="listeReappro-empty__text">
                Aucun mouvement d'entrée de stock n'a encore été enregistré.
            </p>
            <button
                className="app-button app-button--primary"
                onClick={onAdd}
                type="button"
            >
                <Plus size={16} aria-hidden="true" />
                Faire un réapprovisionnement
            </button>
        </div>
    );
}

/* ─── Composant principal ─────────────────────────────────────────────────────── */

function ListeReapprovisionnement() {
    const [items, setItems]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [modalCreation, setModalCreation]   = useState(false);
    const [itemAAnnuler, setItemAAnnuler]     = useState(null);
    const [itemAConfirmer, setItemAConfirmer] = useState(null);
    const [paneItem, setPaneItem]             = useState(null);

    const charger = useCallback(() => {
        setLoading(true);
        setError(null);
        const t = setTimeout(() => {
            try {
                setItems(reapproData.data.reapprovisionnements);
            } catch {
                setError("Impossible de charger les réapprovisionnements.");
            }
            setLoading(false);
        }, 700);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        return charger();
    }, [charger]);

    /* Seuls les en_attente et en_cours sont affichés dans cet onglet */
    const itemsActifs = items.filter(i => i.statut === "en_attente" || i.statut === "en_cours");

    const handleAnnuler = useCallback((e, item) => {
        e.stopPropagation();
        setItemAAnnuler(item);
    }, []);

    const handleConfirmer = useCallback((e, item) => {
        e.stopPropagation();
        setItemAConfirmer(item);
    }, []);

    return (
        <div className="listeReappro-root">

            {/* ─── En-tête page ─────────────────────────────────────────────── */}
            <div className="listeReappro-header">
                <div className="listeReappro-header__text">
                    <h2 className="listeReappro-header__title">Réapprovisionnements</h2>
                    <p className="listeReappro-header__sub">
                        Suivez tous les mouvements d'entrée de stock
                    </p>
                </div>
                <button
                    className="app-button app-button--primary listeReappro-cta"
                    onClick={() => setModalCreation(true)}
                    type="button"
                >
                    <Plus size={16} aria-hidden="true" />
                    Faire un réapprovisionnement
                </button>
            </div>

            {/* ─── État chargement ─────────────────────────────────────────── */}
            {loading && (
                <>
                    <div className="listeReappro-cards" aria-busy="true">
                        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                    <div className="listeReappro-table-wrap">
                        <table className="listeReappro-table">
                            <thead>
                                <tr>
                                    {["Référence", "Fournisseur", "Montant", "Créateur", "Date", "Statut", "Actions"].map(h => (
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

            {/* ─── État erreur ─────────────────────────────────────────────── */}
            {!loading && error && (
                <div className="listeReappro-error" role="alert">
                    <AlertCircle size={32} aria-hidden="true" />
                    <p>{error}</p>
                    <button
                        className="app-button app-button--ghost app-button--sm"
                        onClick={charger}
                        type="button"
                    >
                        <RefreshCw size={14} aria-hidden="true" />
                        Réessayer
                    </button>
                </div>
            )}

            {/* ─── État vide ───────────────────────────────────────────────── */}
            {!loading && !error && itemsActifs.length === 0 && (
                <EmptyState onAdd={() => setModalCreation(true)} />
            )}

            {/* ─── Mobile : cartes ─────────────────────────────────────────── */}
            {!loading && !error && itemsActifs.length > 0 && (
                <ul className="listeReappro-cards" aria-label="Liste des réapprovisionnements">
                    {itemsActifs.map(item => (
                        <li key={item.id}>
                            <button
                                className="listeReappro-card"
                                onClick={() => setPaneItem(item)}
                                type="button"
                            >
                                <div className="listeReappro-card__header">
                                    <div className="listeReappro-card__ref">
                                        <span className="listeReappro-card__ref-num">{item.reference}</span>
                                        <span className="listeReappro-card__fournisseur">{item.fournisseur}</span>
                                    </div>
                                    <BadgeStatut statut={item.statut} />
                                </div>

                                <div className="listeReappro-card__body">
                                    <span className="listeReappro-card__montant">
                                        {formatMontant(item.montant_total)}
                                    </span>
                                    <span className="listeReappro-card__meta">
                                        {item.demandeur.nom} · {formatDate(item.date_demande)}
                                    </span>
                                    <span className="listeReappro-card__lignes">
                                        {item.lignes.length} article{item.lignes.length > 1 ? "s" : ""}
                                    </span>
                                </div>

                                {(peutAnnuler(item.statut) || peutConfirmer(item.statut)) && (
                                    <div className="listeReappro-card__actions" onClick={e => e.stopPropagation()}>
                                        {peutAnnuler(item.statut) && (
                                            <button
                                                className="app-button app-button--ghost app-button--sm listeReappro-btn--danger"
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

                                <ChevronRight size={16} className="listeReappro-card__arrow" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* ─── Desktop : tableau ───────────────────────────────────────── */}
            {!loading && !error && itemsActifs.length > 0 && (
                <div className="listeReappro-table-wrap">
                    <table className="listeReappro-table" aria-label="Liste des réapprovisionnements">
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
                            {itemsActifs.map(item => (
                                <tr
                                    key={item.id}
                                    className="listeReappro-table__row"
                                    onClick={() => setPaneItem(item)}
                                >
                                    <td>
                                        <span className="listeReappro-table__ref">{item.reference}</span>
                                    </td>
                                    <td className="listeReappro-table__fournisseur">{item.fournisseur}</td>
                                    <td className="listeReappro-table__montant">
                                        {formatMontant(item.montant_total)}
                                    </td>
                                    <td>{item.demandeur.nom}</td>
                                    <td className="listeReappro-table__date">{formatDate(item.date_demande)}</td>
                                    <td><BadgeStatut statut={item.statut} /></td>
                                    <td>
                                        <div
                                            className="listeReappro-table__actions"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {peutAnnuler(item.statut) && (
                                                <button
                                                    className="listeReappro-table__action-btn listeReappro-table__action-btn--danger"
                                                    onClick={e => handleAnnuler(e, item)}
                                                    type="button"
                                                    aria-label={`Annuler ${item.reference}`}
                                                >
                                                    <X size={14} aria-hidden="true" />
                                                    Annuler
                                                </button>
                                            )}
                                            {peutConfirmer(item.statut) && (
                                                <button
                                                    className="listeReappro-table__action-btn listeReappro-table__action-btn--confirm"
                                                    onClick={e => handleConfirmer(e, item)}
                                                    type="button"
                                                    aria-label={`Confirmer ${item.reference}`}
                                                >
                                                    <Check size={14} aria-hidden="true" />
                                                    Confirmer
                                                </button>
                                            )}
                                            {!peutAnnuler(item.statut) && !peutConfirmer(item.statut) && (
                                                <span className="listeReappro-table__no-action">—</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── Pagination ──────────────────────────────────────────────── */}
            {!loading && !error && items.length > 0 && (
                <div className="listeReappro-pagination">
                    <span className="listeReappro-pagination__info">
                        {reapproData.pagination.total} résultat{reapproData.pagination.total > 1 ? "s" : ""}
                    </span>
                    <div className="listeReappro-pagination__pages">
                        {[...Array(reapproData.pagination.totalPages)].map((_, i) => (
                            <button
                                key={i}
                                className={`listeReappro-pagination__page${i === 0 ? " listeReappro-pagination__page--active" : ""}`}
                                type="button"
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Modals & Pane ───────────────────────────────────────────── */}
            {modalCreation && (
                <ModalCreationReapprovisionnement onClose={() => setModalCreation(false)} />
            )}
            {itemAAnnuler && (
                <ModalAnnulerReapprovisionnement
                    item={itemAAnnuler}
                    onClose={() => setItemAAnnuler(null)}
                />
            )}
            {itemAConfirmer && (
                <ModalConfirmerReapprovisionnement
                    item={itemAConfirmer}
                    onClose={() => setItemAConfirmer(null)}
                />
            )}
            {paneItem && (
                <PaneDetailsReapprovisionnement
                    item={paneItem}
                    onClose={() => setPaneItem(null)}
                    onAnnuler={() => { setPaneItem(null); setItemAAnnuler(paneItem); }}
                    onConfirmer={() => { setPaneItem(null); setItemAConfirmer(paneItem); }}
                />
            )}
        </div>
    );
}

export default ListeReapprovisionnement;
