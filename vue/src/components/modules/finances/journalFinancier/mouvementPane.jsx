import { useEffect, useState } from "react";
import { X, ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { fetchMouvementDetail } from "../../../../services/financesP5.js";
import { readCache } from "../../../../services/financesCache.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
    d ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d)) : "—";

const TYPE_MAP = {
    "paiement_commande": "Paiement commande",
    "depense_generale": "Dépense",
    "paiement_abonnement": "Abonnement",
    "paiement_ravitaillement": "Réapprovisionnement",
    "entree_generale": "Entrée",
    "salaire": "Salaire",
    "remboursement_commande": "Remboursement",
};

const getReadableType = (type) => TYPE_MAP[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const TYPE_MODULE = {
    "paiement_commande": "/application/finances/commandes",
    "depense_generale": "/application/finances/depenses",
    "paiement_abonnement": "/application/finances/abonnements",
    "paiement_ravitaillement": "/application/finances/reapprovisionnements",
    "entree_generale": "/application/finances/entrees",
    "salaire": "/application/finances/salaires",
    "remboursement_commande": "/application/finances/remboursements",
};

function DetailSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className="finJrn-skeleton finJrn-skeleton--lg" />
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="finJrn-detail__row">
                    <div className="finJrn-skeleton finJrn-skeleton--md" />
                    <div className="finJrn-skeleton finJrn-skeleton--sm" />
                </div>
            ))}
        </div>
    );
}

function MouvementPane({ mouvementId, onClose }) {
    const [loading, setLoading]     = useState(true);
    const [mouvement, setMouvement] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true); // Always set loading to true initially
        setMouvement(null); // Clear previous movement when ID changes

        const cacheKey = `mouvement_${mouvementId}`; // As per financesP5.js
        const staleData = readCache(cacheKey);

        if (staleData) {
            setMouvement(staleData.mouvement);
            setLoading(false); // Display stale data immediately
        }

        fetchMouvementDetail(mouvementId)
            .then(d => { if (!cancelled) { setMouvement(d.mouvement); setLoading(false); } })
            .catch(() => { if (!cancelled && !staleData) setLoading(false); }); // Only set loading to false if no stale data was shown
        return () => { cancelled = true; };
    }, [mouvementId]);


    const isEntree = mouvement?.sens === "entree";
    const moduleLink = mouvement ? TYPE_MODULE[mouvement.type_operation] : null;

    return (
        <>
            <div className="finJrn-drawer__overlay" onClick={onClose} aria-hidden="true" />
            <aside
                className="finJrn-drawer"
                role="complementary"
                aria-label={mouvement ? `Mouvement ${mouvement.id}` : "Chargement"}
            >
                <div className="finJrn-drawer__handle">
                    <div className="finJrn-drawer__handle-bar" />
                </div>

                <div className="finJrn-drawer__header">
                    <h2 className="finJrn-drawer__title">
                        {loading ? "Chargement…" : mouvement ? mouvement.id : "Introuvable"}
                    </h2>
                    <button className="finJrn-drawer__close" onClick={onClose} aria-label="Fermer" type="button">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finJrn-drawer__body">
                    {loading ? (
                        <DetailSkeleton />
                    ) : !mouvement ? (
                        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                            Mouvement introuvable.
                        </p>
                    ) : (
                        <>
                            {/* Montant hero */}
                            <div className="finJrn-pane-hero">
                                <div className={`finJrn-pane-hero__icon ${isEntree ? "finJrn-pane-hero__icon--entree" : "finJrn-pane-hero__icon--sortie"}`}>
                                    {isEntree
                                        ? <ArrowUpRight size={24} aria-hidden="true" />
                                        : <ArrowDownLeft size={24} aria-hidden="true" />
                                    }
                                </div>
                                <div>
                                    <p className={`finJrn-pane-hero__amount ${isEntree ? "finJrn-pane-hero__amount--entree" : "finJrn-pane-hero__amount--sortie"}`}>
                                        {isEntree ? "+" : "−"}{fmt(mouvement.montant)}
                                    </p>
                                    <p className="finJrn-pane-hero__type">{getReadableType(mouvement.type_operation)}</p>
                                </div>
                            </div>

                            {/* Détails */}
                            <section>
                                <p className="finJrn-detail__section-label">Détails du mouvement</p>
                                <div className="finJrn-detail__row">
                                    <span className="finJrn-detail__key">Identifiant</span>
                                    <span className="finJrn-detail__val" style={{ fontFamily: "var(--font-mono)" }}>{mouvement.id}</span>
                                </div>
                                <div className="finJrn-detail__row">
                                    <span className="finJrn-detail__key">Date</span>
                                    <span className="finJrn-detail__val">{fmtDate(mouvement.date_operation)}</span>
                                </div>
                                <div className="finJrn-detail__row">
                                    <span className="finJrn-detail__key">Type</span>
                                    <span className="finJrn-detail__val">{getReadableType(mouvement.type_operation)}</span>
                                </div>
                                <div className="finJrn-detail__row">
                                    <span className="finJrn-detail__key">Sens</span>
                                    <span className="finJrn-detail__val">
                                        <span className={`fin-badge ${isEntree ? "fin-badge--success" : "fin-badge--error"}`}>
                                            {isEntree ? "Entrée" : "Sortie"}
                                        </span>
                                    </span>
                                </div>
                                <div className="finJrn-detail__row">
                                    <span className="finJrn-detail__key">Référence</span>
                                    <span className="finJrn-detail__val" style={{ fontFamily: "var(--font-mono)" }}>{mouvement.reference?.id}</span>
                                </div>
                                <div className="finJrn-detail__row">
                                    <span className="finJrn-detail__key">Utilisateur</span>
                                    <span className="finJrn-detail__val">{mouvement.utilisateur}</span>
                                </div>
                            </section>

                            {/* Description */}
                            <section>
                                <p className="finJrn-detail__section-label">Description</p>
                                <div className="finJrn-justify-block">
                                    {mouvement.description}
                                </div>
                            </section>

                            {/* Voir élément associé */}
                            {moduleLink && (
                                <section>
                                    <p className="finJrn-detail__section-label">Élément associé</p>
                                    <a
                                        href={moduleLink}
                                        className="finJrn-associated-link"
                                    >
                                        <span>Voir l'élément lié</span>
                                        <ExternalLink size={14} aria-hidden="true" />
                                    </a>
                                </section>
                            )}
                        </>
                    )}
                </div>

                <div className="finJrn-drawer__footer">
                    <button
                        className="app-button app-button--ghost"
                        style={{ width: "100%" }}
                        onClick={onClose}
                        type="button"
                    >
                        Fermer
                    </button>
                </div>
            </aside>
        </>
    );
}

export default MouvementPane;
