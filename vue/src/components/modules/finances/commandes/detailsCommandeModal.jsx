import { useState, useEffect } from "react";
import { X, Package, CreditCard, Loader } from "lucide-react";
import { fetchCommandeDetail } from "../../../../services/financesDashboard.js";
import "../../../../assets/styles/components/modules/finances/detailsCommandeModal.css";

function SkeletonSection() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="finCommandes-detail__row">
                    <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--sm" />
                    <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--md" />
                </div>
            ))}
        </div>
    );
}

function DetailsCommandeModal({ commande, onClose }) {
    const [detail,  setDetail]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);
        fetchCommandeDetail(commande.id)
            .then(res => setDetail(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [commande.id]);

    const data = detail ?? commande;

    const fmt = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const fmtDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const pct = data.total > 0
        ? Math.min(100, Math.round(((data.paye ?? 0) / data.total) * 100))
        : 0;

    const resteAPayer = (data.total ?? 0) - (data.paye ?? 0);

    return (
        <div
            className="finCommandes-modal__overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-commande-title"
        >
            <div className="finCommandes-modal__panel finCommandes-modal__panel--large">

                <div className="finCommandes-modal__header">
                    <h2 className="finCommandes-modal__title" id="detail-commande-title">
                        {loading ? "Chargement…" : data.nom ?? "Détails de la commande"}
                    </h2>
                    <button
                        className="finCommandes-modal__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finCommandes-modal__body">

                    {loading ? (
                        <>
                            <SkeletonSection />
                            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4)", color: "var(--color-text-muted)" }}>
                                <Loader size={20} aria-hidden="true" style={{ animation: "spin 1s linear infinite" }} />
                            </div>
                        </>
                    ) : error ? (
                        /* Fallback minimal si le fetch échoue */
                        <>
                            <div className="finCommandes-detail__row">
                                <span className="finCommandes-detail__key">Référence</span>
                                <span className="finCommandes-detail__val">{commande.id}</span>
                            </div>
                            <div className="finCommandes-detail__row">
                                <span className="finCommandes-detail__key">Libellé</span>
                                <span className="finCommandes-detail__val">{commande.nom}</span>
                            </div>
                            <div className="finCommandes-detail__row">
                                <span className="finCommandes-detail__key">Montant total</span>
                                <span className="finCommandes-detail__val finCommandes-detail__val--amount">{fmt(commande.total)}</span>
                            </div>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-2)" }}>
                                Le détail complet n'a pas pu être chargé.
                            </p>
                        </>
                    ) : (
                        <>
                            {/* Informations générales */}
                            <section>
                                <p className="finCommandes-detail__section-label">Informations</p>
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Référence</span>
                                    <span className="finCommandes-detail__val">{data.id}</span>
                                </div>
                                {data.client && (
                                    <div className="finCommandes-detail__row">
                                        <span className="finCommandes-detail__key">Client</span>
                                        <span className="finCommandes-detail__val">{data.client}</span>
                                    </div>
                                )}
                                {data.date && (
                                    <div className="finCommandes-detail__row">
                                        <span className="finCommandes-detail__key">Date</span>
                                        <span className="finCommandes-detail__val">{fmtDate(data.date)}</span>
                                    </div>
                                )}
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Montant total</span>
                                    <span className="finCommandes-detail__val finCommandes-detail__val--amount">{fmt(data.total)}</span>
                                </div>
                                {data.minimumValidation != null && (
                                    <div className="finCommandes-detail__row">
                                        <span className="finCommandes-detail__key">Seuil de validation</span>
                                        <span className="finCommandes-detail__val finCommandes-detail__val--amount">{fmt(data.minimumValidation)}</span>
                                    </div>
                                )}
                                {data.paye != null && (
                                    <>
                                        <div className="finCommandes-detail__row">
                                            <span className="finCommandes-detail__key">Montant payé</span>
                                            <span className="finCommandes-detail__val finCommandes-detail__val--amount" style={{ color: "var(--color-success)" }}>
                                                {fmt(data.paye)}
                                            </span>
                                        </div>
                                        <div className="finCommandes-detail__row">
                                            <span className="finCommandes-detail__key">Reste à payer</span>
                                            <span className="finCommandes-detail__val finCommandes-detail__val--amount" style={{ color: resteAPayer > 0 ? "var(--color-error)" : "var(--color-success)" }}>
                                                {fmt(resteAPayer)}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {data.statut && (
                                    <div className="finCommandes-detail__row">
                                        <span className="finCommandes-detail__key">Statut</span>
                                        <span className="finCommandes-detail__val">
                                            <span className={`fin-badge ${data.statut === "partiellement payé" ? "fin-badge--warning" : "fin-badge--neutral"}`}>
                                                {data.statut}
                                            </span>
                                        </span>
                                    </div>
                                )}
                            </section>

                            {/* Avancement */}
                            {data.paye != null && (
                                <section>
                                    <p className="finCommandes-detail__section-label">Avancement</p>
                                    <div className="finCommandes-progress">
                                        <div className="finCommandes-progress__bar" style={{ height: "8px" }}>
                                            <div
                                                className={`finCommandes-progress__fill${pct >= 100 ? " finCommandes-progress__fill--complete" : ""}`}
                                                style={{ width: `${pct}%` }}
                                                role="progressbar"
                                                aria-valuenow={pct}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            />
                                        </div>
                                        <span className="finCommandes-progress__text">
                                            {pct}% — {fmt(data.paye)} sur {fmt(data.total)}
                                        </span>
                                    </div>
                                </section>
                            )}

                            {/* Produits */}
                            {data.produits?.length > 0 && (
                                <section>
                                    <p className="finCommandes-detail__section-label">
                                        <Package size={12} aria-hidden="true" style={{ display: "inline", marginRight: "4px" }} />
                                        Produits ({data.produits.length})
                                    </p>
                                    <table className="finCommandes-payments__table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Réf.</th>
                                                <th scope="col">Produit</th>
                                                <th scope="col">Qté</th>
                                                <th scope="col">P.U.</th>
                                                <th scope="col">Sous-total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.produits.map(p => (
                                                <tr key={p.reference}>
                                                    <td style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{p.reference}</td>
                                                    <td>{p.nom}</td>
                                                    <td>{p.quantite}</td>
                                                    <td>{fmt(p.prix_unitaire)}</td>
                                                    <td><strong>{fmt(p.sous_total)}</strong></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </section>
                            )}

                            {/* Paiements associés */}
                            <section>
                                <p className="finCommandes-detail__section-label">
                                    <CreditCard size={12} aria-hidden="true" style={{ display: "inline", marginRight: "4px" }} />
                                    Paiements enregistrés
                                </p>
                                {!data.paiements?.length ? (
                                    <p className="finCommandes-payments__empty">Aucun paiement enregistré pour cette commande.</p>
                                ) : (
                                    <table className="finCommandes-payments__table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Date</th>
                                                <th scope="col">Montant</th>
                                                <th scope="col">Mode</th>
                                                <th scope="col">Réf. trans.</th>
                                                <th scope="col">Par</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.paiements.map((p, i) => (
                                                <tr key={p.id ?? i}>
                                                    <td>{fmtDate(p.date)}</td>
                                                    <td><strong>{fmt(p.montant)}</strong></td>
                                                    <td>
                                                        <span className="fin-badge fin-badge--info">{p.mode}</span>
                                                    </td>
                                                    <td style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                                                        {p.reference || "—"}
                                                    </td>
                                                    <td>{p.utilisateur}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </section>
                        </>
                    )}
                </div>

                <div className="finCommandes-modal__footer">
                    <button
                        className="app-button app-button--primary"
                        onClick={onClose}
                        type="button"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DetailsCommandeModal;
