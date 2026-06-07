import { useState, useEffect } from "react";
import { X, CreditCard, PlusCircle, Package, Loader } from "lucide-react";
import EnregistrerPaiementForm from "./EnregistrerPaiementForm.jsx";
import { fetchCommandeDetail } from "../../../../services/financesDashboard.js";

function CommandePane({ commande, onClose }) {
    const [detail,          setDetail]          = useState(null);
    const [loadingDetail,   setLoadingDetail]   = useState(true);
    const [showFormPaiement, setShowFormPaiement] = useState(false);

    useEffect(() => {
        setLoadingDetail(true);
        fetchCommandeDetail(commande.id)
            .then(res => setDetail(res.data))
            .catch(() => setDetail(null))
            .finally(() => setLoadingDetail(false));
    }, [commande.id]);

    const data = detail ?? commande;

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const resteAPayer = data.total - data.paye;
    const pct = Math.min(100, Math.round((data.paye / data.total) * 100));

    return (
        <>
            <div
                className="finCommandes-drawer__overlay"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finCommandes-drawer"
                role="complementary"
                aria-label={`Détails de ${data.nom}`}
            >
                <div className="finCommandes-drawer__handle">
                    <div className="finCommandes-drawer__handle-bar" />
                </div>

                <div className="finCommandes-drawer__header">
                    <h2 className="finCommandes-drawer__title">{data.nom}</h2>
                    <button
                        className="finCommandes-drawer__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finCommandes-drawer__body">

                    {loadingDetail ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="finCommandes-detail__row">
                                    <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--sm" />
                                    <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--md" />
                                </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4)", color: "var(--color-text-muted)" }}>
                                <Loader size={20} aria-hidden="true" style={{ animation: "spin 1s linear infinite" }} />
                            </div>
                        </div>
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
                                        <span className="finCommandes-detail__val">{formatDate(data.date)}</span>
                                    </div>
                                )}
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Montant total</span>
                                    <span className="finCommandes-detail__val finCommandes-detail__val--amount">{formatMontant(data.total)}</span>
                                </div>
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Seuil de validation</span>
                                    <span className="finCommandes-detail__val finCommandes-detail__val--amount">{formatMontant(data.minimumValidation)}</span>
                                </div>
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Montant payé</span>
                                    <span className="finCommandes-detail__val finCommandes-detail__val--amount" style={{ color: "var(--color-success)" }}>
                                        {formatMontant(data.paye)}
                                    </span>
                                </div>
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Reste à payer</span>
                                    <span className="finCommandes-detail__val finCommandes-detail__val--amount" style={{ color: resteAPayer > 0 ? "var(--color-error)" : "var(--color-success)" }}>
                                        {formatMontant(resteAPayer)}
                                    </span>
                                </div>
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Statut</span>
                                    <span className="finCommandes-detail__val">
                                        <span className={`fin-badge ${data.statut === "partiellement payé" ? "fin-badge--warning" : "fin-badge--neutral"}`}>
                                            {data.statut}
                                        </span>
                                    </span>
                                </div>
                            </section>

                            {/* Avancement */}
                            <section>
                                <p className="finCommandes-detail__section-label">Avancement du paiement</p>
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
                                        {pct}% — {formatMontant(data.paye)} payés sur {formatMontant(data.total)}
                                    </span>
                                </div>
                            </section>

                            {/* Produits */}
                            {data.produits?.length > 0 && (
                                <section>
                                    <p className="finCommandes-detail__section-label">
                                        <Package size={12} aria-hidden="true" style={{ display: "inline", marginRight: "4px" }} />
                                        Produits
                                    </p>
                                    <table className="finCommandes-payments__table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Produit</th>
                                                <th scope="col">Qté</th>
                                                <th scope="col">Sous-total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.produits.map(p => (
                                                <tr key={p.reference}>
                                                    <td>{p.nom}</td>
                                                    <td>{p.quantite}</td>
                                                    <td><strong>{formatMontant(p.sous_total)}</strong></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </section>
                            )}

                            {/* Historique des paiements */}
                            <section>
                                <p className="finCommandes-detail__section-label">
                                    <CreditCard size={12} aria-hidden="true" style={{ display: "inline", marginRight: "4px" }} />
                                    Paiements associés
                                </p>
                                {!data.paiements?.length ? (
                                    <p className="finCommandes-payments__empty">Aucun paiement enregistré.</p>
                                ) : (
                                    <table className="finCommandes-payments__table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Date</th>
                                                <th scope="col">Montant</th>
                                                <th scope="col">Mode</th>
                                                <th scope="col">Réf.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.paiements.map((p, i) => (
                                                <tr key={p.id ?? i}>
                                                    <td>{formatDate(p.date)}</td>
                                                    <td><strong>{formatMontant(p.montant)}</strong></td>
                                                    <td>{p.mode}</td>
                                                    <td>{p.reference || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </section>
                        </>
                    )}
                </div>

                <div className="finCommandes-drawer__footer">
                    <button
                        className="app-button app-button--primary"
                        style={{ width: "100%" }}
                        onClick={() => setShowFormPaiement(true)}
                        type="button"
                        disabled={loadingDetail}
                    >
                        <PlusCircle size={16} aria-hidden="true" />
                        Enregistrer un paiement
                    </button>
                </div>
            </aside>

            {showFormPaiement && (
                <EnregistrerPaiementForm
                    commande={data}
                    onClose={() => setShowFormPaiement(false)}
                />
            )}
        </>
    );
}

export default CommandePane;
