import { X } from "lucide-react";

function DetailsCommandeRemboursementModal({ commande, onClose }) {
    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    console.log("commande :", commande);

    return (
        <div className="finRemb-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="detailcmd-remb-title">
            <div className="finRemb-modal__panel">

                <div className="finRemb-modal__header">
                    <h2 className="finRemb-modal__title" id="detailcmd-remb-title">
                        Détails de la commande
                    </h2>
                    <button
                        className="finRemb-modal__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finRemb-modal__body">
                    <div className="finRemb-detail__row">
                        <span className="finRemb-detail__key">Référence</span>
                        <span className="finRemb-detail__val">{commande.id}</span>
                    </div>
                    <div className="finRemb-detail__row">
                        <span className="finRemb-detail__key">Libellé / Client</span>
                        <span className="finRemb-detail__val" style={{ textAlign: "right", maxWidth: "260px" }}>{commande.nom}</span>
                    </div>
                    <div className="finRemb-detail__row">
                        <span className="finRemb-detail__key">Montant total facturé</span>
                        <span className="finRemb-detail__val finRemb-detail__val--amount">{formatMontant(commande.totalFacture)}</span>
                    </div>
                    <div className="finRemb-detail__row">
                        <span className="finRemb-detail__key">Montant total payé</span>
                        <span className="finRemb-detail__val finRemb-detail__val--amount" style={{ color: "var(--color-success)" }}>
                            {formatMontant(commande.totalPaye)}
                        </span>
                    </div>
                </div>

                <div className="finRemb-modal__footer">
                    <button
                        className="app-button app-button--primary"
                        onClick={onClose}
                        type="button"
                        style={{ width: "100%" }}
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DetailsCommandeRemboursementModal;
