import { X } from "lucide-react";

function DetailsCommandeModal({ commande, onClose }) {
    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    return (
        <div className="finCommandes-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="detail-commande-title">
            <div className="finCommandes-modal__panel">

                <div className="finCommandes-modal__header">
                    <h2 className="finCommandes-modal__title" id="detail-commande-title">
                        Détails de la commande
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
                    <div className="finCommandes-detail__row">
                        <span className="finCommandes-detail__key">Référence</span>
                        <span className="finCommandes-detail__val">{commande.id}</span>
                    </div>
                    <div className="finCommandes-detail__row">
                        <span className="finCommandes-detail__key">Libellé / Client</span>
                        <span className="finCommandes-detail__val">{commande.nom}</span>
                    </div>
                    <div className="finCommandes-detail__row">
                        <span className="finCommandes-detail__key">Montant total facturé</span>
                        <span className="finCommandes-detail__val finCommandes-detail__val--amount">
                            {formatMontant(commande.total)}
                        </span>
                    </div>
                </div>

                <div className="finCommandes-modal__footer">
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

export default DetailsCommandeModal;
