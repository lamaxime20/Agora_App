import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import DetailsCommandeRemboursementModal from "./DetailsCommandeRemboursementModal.jsx";

function RemboursementPane({ remboursement, onClose }) {
    const [showCommandeModal, setShowCommandeModal] = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));

    return (
        <>
            <div
                className="finRemb-drawer__overlay"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finRemb-drawer"
                role="complementary"
                aria-label={`Détails du remboursement ${remboursement.id}`}
            >
                <div className="finRemb-drawer__handle">
                    <div className="finRemb-drawer__handle-bar" />
                </div>

                <div className="finRemb-drawer__header">
                    <h2 className="finRemb-drawer__title">Remboursement {remboursement.id}</h2>
                    <button
                        className="finRemb-drawer__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finRemb-drawer__body">
                    <section>
                        <p className="finRemb-detail__section-label">Détails du remboursement</p>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Date</span>
                            <span className="finRemb-detail__val">{formatDate(remboursement.date)}</span>
                        </div>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Montant remboursé</span>
                            <span className="finRemb-detail__val finRemb-detail__val--amount" style={{ color: "var(--color-error)" }}>
                                {formatMontant(remboursement.montant)}
                            </span>
                        </div>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Cause</span>
                            <span className="finRemb-detail__val" style={{ textAlign: "right", maxWidth: "260px" }}>{remboursement.cause}</span>
                        </div>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Enregistré par</span>
                            <span className="finRemb-detail__val">{remboursement.utilisateur}</span>
                        </div>
                    </section>

                    <section>
                        <p className="finRemb-detail__section-label">Commande associée</p>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Référence</span>
                            <span className="finRemb-detail__val">{remboursement.commandeAssociee.id}</span>
                        </div>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Libellé</span>
                            <span className="finRemb-detail__val" style={{ textAlign: "right", maxWidth: "260px" }}>
                                {remboursement.commandeAssociee.nom}
                            </span>
                        </div>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Total facturé</span>
                            <span className="finRemb-detail__val finRemb-detail__val--amount">
                                {formatMontant(remboursement.commandeAssociee.totalFacture)}
                            </span>
                        </div>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Total payé</span>
                            <span className="finRemb-detail__val finRemb-detail__val--amount" style={{ color: "var(--color-success)" }}>
                                {formatMontant(remboursement.commandeAssociee.totalPaye)}
                            </span>
                        </div>
                    </section>
                </div>

                <div className="finRemb-drawer__footer">
                    <button
                        className="app-button app-button--ghost"
                        style={{ width: "100%" }}
                        onClick={() => setShowCommandeModal(true)}
                        type="button"
                    >
                        <ExternalLink size={16} aria-hidden="true" />
                        Voir la commande associée
                    </button>
                </div>
            </aside>

            {showCommandeModal && (
                <DetailsCommandeRemboursementModal
                    commande={remboursement.commandeAssociee}
                    onClose={() => setShowCommandeModal(false)}
                />
            )}
        </>
    );
}

export default RemboursementPane;
