import { useState } from "react";
import { X, CreditCard, PlusCircle } from "lucide-react";
import EnregistrerPaiementForm from "./EnregistrerPaiementForm.jsx";

function CommandePane({ commande, onClose }) {
    const [showFormPaiement, setShowFormPaiement] = useState(false);

    const historiquePaiements = [
        { date: "2026-06-01", montant: 500, mode: "virement bancaire", reference: "VR-98234", utilisateur: "Jean Comptable" }
    ];

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const resteAPayer = commande.total - commande.paye;
    const pct = Math.min(100, Math.round((commande.paye / commande.total) * 100));

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
                aria-label={`Détails de ${commande.nom}`}
            >
                <div className="finCommandes-drawer__handle">
                    <div className="finCommandes-drawer__handle-bar" />
                </div>

                <div className="finCommandes-drawer__header">
                    <h2 className="finCommandes-drawer__title">{commande.nom}</h2>
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

                    {/* Infos commande */}
                    <section>
                        <p className="finCommandes-detail__section-label">Informations</p>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Référence</span>
                            <span className="finCommandes-detail__val">{commande.id}</span>
                        </div>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Montant total</span>
                            <span className="finCommandes-detail__val finCommandes-detail__val--amount">{formatMontant(commande.total)}</span>
                        </div>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Seuil de validation</span>
                            <span className="finCommandes-detail__val finCommandes-detail__val--amount">{formatMontant(commande.minimumValidation)}</span>
                        </div>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Montant payé</span>
                            <span className="finCommandes-detail__val finCommandes-detail__val--amount" style={{ color: "var(--color-success)" }}>{formatMontant(commande.paye)}</span>
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
                                <span className={`fin-badge ${commande.statut === "partiellement payé" ? "fin-badge--warning" : "fin-badge--neutral"}`}>
                                    {commande.statut}
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
                                />
                            </div>
                            <span className="finCommandes-progress__text">{pct}% — {formatMontant(commande.paye)} payés sur {formatMontant(commande.total)}</span>
                        </div>
                    </section>

                    {/* Historique des paiements */}
                    <section>
                        <p className="finCommandes-detail__section-label">Paiements associés</p>
                        {historiquePaiements.length === 0 ? (
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
                                    {historiquePaiements.map((p, i) => (
                                        <tr key={i}>
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
                </div>

                <div className="finCommandes-drawer__footer">
                    <button
                        className="app-button app-button--primary"
                        style={{ width: "100%" }}
                        onClick={() => setShowFormPaiement(true)}
                        type="button"
                    >
                        <PlusCircle size={16} aria-hidden="true" />
                        Enregistrer un paiement
                    </button>
                </div>
            </aside>

            {showFormPaiement && (
                <EnregistrerPaiementForm
                    commande={commande}
                    onClose={() => setShowFormPaiement(false)}
                />
            )}
        </>
    );
}

export default CommandePane;
