import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import DetailsCommandeModal from "./DetailsCommandeModal.jsx";
import "../../../../assets/styles/components/modules/finances/paiementPane.css";

function PaiementPane({ paiement, onClose }) {
    const [showCommandeModal, setShowCommandeModal] = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));

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
                aria-label={`Détails du paiement ${paiement.id}`}
            >
                <div className="finCommandes-drawer__handle">
                    <div className="finCommandes-drawer__handle-bar" />
                </div>

                <div className="finCommandes-drawer__header">
                    <h2 className="finCommandes-drawer__title">Paiement {paiement.id}</h2>
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

                    <section>
                        <p className="finCommandes-detail__section-label">Détails du paiement</p>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Date</span>
                            <span className="finCommandes-detail__val">{formatDate(paiement.date)}</span>
                        </div>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Montant</span>
                            <span className="finCommandes-detail__val finCommandes-detail__val--amount">{formatMontant(paiement.montant)}</span>
                        </div>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Mode de paiement</span>
                            <span className="finCommandes-detail__val">
                                <span className="fin-badge fin-badge--info">{paiement.mode}</span>
                            </span>
                        </div>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Référence transaction</span>
                            <span className="finCommandes-detail__val">{paiement.reference || "Aucune (espèces)"}</span>
                        </div>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Enregistré par</span>
                            <span className="finCommandes-detail__val">{paiement.utilisateur}</span>
                        </div>
                    </section>

                    <section>
                        <p className="finCommandes-detail__section-label">Commande associée</p>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Référence</span>
                            <span className="finCommandes-detail__val">{paiement.commandeAssociee.id}</span>
                        </div>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Libellé</span>
                            <span className="finCommandes-detail__val">{paiement.commandeAssociee.nom}</span>
                        </div>
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Total commande</span>
                            <span className="finCommandes-detail__val finCommandes-detail__val--amount">{formatMontant(paiement.commandeAssociee.total)}</span>
                        </div>
                    </section>
                </div>

                <div className="finCommandes-drawer__footer">
                    <button
                        className="app-button app-button--ghost"
                        style={{ width: "100%" }}
                        onClick={() => setShowCommandeModal(true)}
                        type="button"
                    >
                        <ExternalLink size={16} aria-hidden="true" />
                        Voir la commande complète
                    </button>
                </div>
            </aside>

            {showCommandeModal && (
                <DetailsCommandeModal
                    commande={paiement.commandeAssociee}
                    onClose={() => setShowCommandeModal(false)}
                />
            )}
        </>
    );
}

export default PaiementPane;
