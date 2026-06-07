import { useState, useEffect, useCallback } from "react";
import {
    AlertTriangle, Plus, AlertCircle, RefreshCw,
    Clock, ChevronRight, Trash2,
} from "lucide-react";
import ModalSignalerPerte from "./modalSignalerPerte.jsx";
import ModalAnnulerPerte  from "./modalAnnulerPerte.jsx";
import PaneDetailsPerte   from "./paneDetailsPerte.jsx";
import { fetchStockPertes } from "../../../../services/gestionStock.js";
import "../../../../assets/styles/components/modules/gestionStocks/listePertes.css";

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
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

function BadgeMotif({ motif }) {
    const cfg = MOTIF_CONFIG[motif] ?? { label: motif, mod: "muted" };
    return (
        <span className={`listePertes-badge listePertes-badge--${cfg.mod}`}>
            {cfg.label}
        </span>
    );
}

/* ─── Hook countdown ──────────────────────────────────────────────────────────── */

function useCountdown(targetIso) {
    const getRemaining = useCallback(() => {
        const diff = new Date(targetIso).getTime() - Date.now();
        if (diff <= 0) return null;
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1_000);
        return { h, m, s, diff };
    }, [targetIso]);

    const [remaining, setRemaining] = useState(getRemaining);

    useEffect(() => {
        const id = setInterval(() => {
            const r = getRemaining();
            setRemaining(r);
            if (!r) clearInterval(id);
        }, 1_000);
        return () => clearInterval(id);
    }, [getRemaining]);

    return remaining;
}

/* ─── Affichage countdown ─────────────────────────────────────────────────────── */

function Countdown({ targetIso }) {
    const remaining = useCountdown(targetIso);

    if (!remaining) {
        return (
            <span className="listePertes-countdown listePertes-countdown--expired">
                <Clock size={12} aria-hidden="true" />
                Délai expiré
            </span>
        );
    }

    const urgent = remaining.diff < 3_600_000;

    return (
        <span className={`listePertes-countdown${urgent ? " listePertes-countdown--urgent" : ""}`}>
            <Clock size={12} aria-hidden="true" />
            {remaining.h > 0 && `${remaining.h}h `}
            {remaining.m}m {remaining.s}s
        </span>
    );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────────── */

function SkeletonCard() {
    return (
        <div className="listePertes-card listePertes-card--skeleton" aria-hidden="true">
            <div className="listePertes-skel__top">
                <div className="listePertes-skel__line listePertes-skel__line--lg" />
                <div className="listePertes-skel__badge" />
            </div>
            <div className="listePertes-skel__line listePertes-skel__line--md" />
            <div className="listePertes-skel__line listePertes-skel__line--sm" />
        </div>
    );
}

/* ─── Empty state ─────────────────────────────────────────────────────────────── */

function EmptyState({ onSignaler }) {
    return (
        <div className="listePertes-empty">
            <div className="listePertes-empty__icon">
                <AlertTriangle size={36} aria-hidden="true" />
            </div>
            <h3 className="listePertes-empty__title">Aucune perte récente</h3>
            <p className="listePertes-empty__text">
                Aucune perte déclarée dans les dernières 24 heures.
            </p>
            <button
                className="app-button listePertes-cta-signaler"
                onClick={onSignaler}
                type="button"
            >
                <Plus size={16} aria-hidden="true" />
                Signaler une perte
            </button>
        </div>
    );
}

/* ─── Composant principal ─────────────────────────────────────────────────────── */

function ListePertes() {
    const [items, setItems]             = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [modalSignaler, setModalSignaler] = useState(false);
    const [perteAAnnuler, setPerteAAnnuler] = useState(null);
    const [paneItem, setPaneItem]           = useState(null);

    const charger = useCallback(() => {
        setLoading(true);
        setError(null);
        let active = true;

        (async () => {
            try {
                const payload = await fetchStockPertes({ limit: 100 });
                if (!active) return;
                setItems(payload.items ?? []);
            } catch {
                if (active) {
                    setError("Impossible de charger les pertes.");
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

    const peutAnnuler = (item) => {
        if (!item.date_limite_annulation) return false;
        return new Date(item.date_limite_annulation).getTime() > Date.now();
    };

    return (
        <div className="listePertes-root">

            {/* ─── En-tête ─────────────────────────────────────────── */}
            <div className="listePertes-header">
                <div className="listePertes-header__text">
                    <h2 className="listePertes-header__title">Pertes en cours</h2>
                    <p className="listePertes-header__sub">
                        Les pertes déclarées peuvent être annulées dans les 24 heures
                    </p>
                </div>
                <button
                    className="app-button listePertes-cta-signaler"
                    onClick={() => setModalSignaler(true)}
                    type="button"
                >
                    <Plus size={16} aria-hidden="true" />
                    Signaler une perte
                </button>
            </div>

            {/* ─── Chargement ──────────────────────────────────────── */}
            {loading && (
                <div className="listePertes-cards" aria-busy="true">
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {/* ─── Erreur ──────────────────────────────────────────── */}
            {!loading && error && (
                <div className="listePertes-error" role="alert">
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
            {!loading && !error && items.length === 0 && (
                <EmptyState onSignaler={() => setModalSignaler(true)} />
            )}

            {/* ─── Liste cartes ────────────────────────────────────── */}
            {!loading && !error && items.length > 0 && (
                <ul className="listePertes-cards" aria-label="Pertes récentes">
                    {items.map(item => (
                        <li key={item.id}>
                            <button
                                className="listePertes-card"
                                onClick={() => setPaneItem(item)}
                                type="button"
                            >
                                {/* Countdown badge */}
                                {item.date_limite_annulation && (
                                    <div className="listePertes-card__countdown-wrap">
                                        <Countdown targetIso={item.date_limite_annulation} />
                                    </div>
                                )}

                                <div className="listePertes-card__header">
                                    <div className="listePertes-card__product">
                                        <span className="listePertes-card__product-name">
                                            {item.produit.nom}
                                        </span>
                                        <span className="listePertes-card__ref">
                                            {item.reference}
                                        </span>
                                    </div>
                                    <BadgeMotif motif={item.motif} />
                                </div>

                                <div className="listePertes-card__body">
                                    <div className="listePertes-card__row">
                                        <span className="listePertes-card__qty">
                                            {item.quantite} {item.produit.unite}{item.quantite > 1 ? "s" : ""}
                                        </span>
                                        <span className="listePertes-card__valeur">
                                            {formatMontant(item.valeur_totale)}
                                        </span>
                                    </div>
                                    <span className="listePertes-card__meta">
                                        {item.declarant.nom} · {formatDate(item.date_declaration)}
                                    </span>
                                </div>

                                {peutAnnuler(item) && (
                                    <div
                                        className="listePertes-card__actions"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <button
                                            className="listePertes-card__annuler-btn"
                                            onClick={e => { e.stopPropagation(); setPerteAAnnuler(item); }}
                                            type="button"
                                        >
                                            <Trash2 size={13} aria-hidden="true" />
                                            Annuler cette perte
                                        </button>
                                    </div>
                                )}

                                <ChevronRight size={14} className="listePertes-card__arrow" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* ─── Modals & Pane ───────────────────────────────────── */}
            {modalSignaler && (
                <ModalSignalerPerte onClose={() => setModalSignaler(false)} onSaved={charger} />
            )}
            {perteAAnnuler && (
                <ModalAnnulerPerte
                    item={perteAAnnuler}
                    onClose={() => setPerteAAnnuler(null)}
                    onConfirm={() => { setPerteAAnnuler(null); charger(); }}
                />
            )}
            {paneItem && (
                <PaneDetailsPerte
                    item={paneItem}
                    onClose={() => setPaneItem(null)}
                    onAnnuler={() => { setPaneItem(null); setPerteAAnnuler(paneItem); }}
                    peutAnnuler={peutAnnuler(paneItem)}
                />
            )}
        </div>
    );
}

export default ListePertes;
