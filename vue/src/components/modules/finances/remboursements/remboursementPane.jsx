import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import DetailsCommandeRemboursementModal from "./detailsCommandeRemboursementModal.jsx";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) => {
    // Si la date est invalide (null, undefined, ou chaîne invalide), ne rien afficher pour éviter une erreur.
    if (!d || isNaN(new Date(d))) return "";
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));
};

function RemboursementPane({ remboursement, onClose }) {
    const [showCommandeModal, setShowCommandeModal] = useState(false);

    const cmd = remboursement.commandeAssociee ?? {};
    const cmdLabel = cmd.nom ?? `${cmd.client ?? ""} — ${cmd.id ?? ""}`.trim();

    console.log("remboursement :", remboursement);

    return (
        <>
            <div className="finRemb-drawer__overlay" onClick={onClose} aria-hidden="true" />
            <aside
                className="finRemb-drawer"
                role="dialog"
                aria-modal="true"
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
                            <span className="finRemb-detail__val">{fmtDate(remboursement.date)}</span>
                            <span className="finRemb-detail__val">{fmtDate(remboursement.date_remboursement)}</span>
                        </div>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Montant remboursé</span>
                            <span
                                className="finRemb-detail__val finRemb-detail__val--amount"
                                style={{ color: "var(--color-error)" }}
                            >
                                {fmt(remboursement.montant)}
                            </span>
                        </div>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Cause</span>
                            <span className="finRemb-detail__val" style={{ textAlign: "right", maxWidth: "260px" }}>
                                {remboursement.cause}
                            </span>
                        </div>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Enregistré par</span>
                            <span className="finRemb-detail__val">{remboursement.utilisateur}</span>
                            <span className="finRemb-detail__val">{remboursement.enregistre_par}</span>
                        </div>
                    </section>

                    <section>
                        <p className="finRemb-detail__section-label">Commande associée</p>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Référence</span>
                            <span className="finRemb-detail__val">{cmd.id}</span>
                            <span className="finRemb-detail__val">{remboursement.commande_numero}</span>
                        </div>
                        <div className="finRemb-detail__row">
                            <span className="finRemb-detail__key">Client</span>
                            <span className="finRemb-detail__val" style={{ textAlign: "right", maxWidth: "260px" }}>
                                {cmdLabel}
                                {remboursement.client}
                            </span>
                        </div>
                        {cmd.totalFacture != null && (
                            <div className="finRemb-detail__row">
                                <span className="finRemb-detail__key">Total facturé</span>
                                <span className="finRemb-detail__val finRemb-detail__val--amount">
                                    {fmt(cmd.totalFacture)}
                                </span>
                            </div>
                        )}
                        {cmd.totalPaye != null && (
                            <div className="finRemb-detail__row">
                                <span className="finRemb-detail__key">Total payé</span>
                                <span
                                    className="finRemb-detail__val finRemb-detail__val--amount"
                                    style={{ color: "var(--color-success)" }}
                                >
                                    {fmt(cmd.totalPaye)}
                                </span>
                            </div>
                        )}
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
                    commande={{ ...cmd, nom: cmdLabel }}
                    commande={{
                        id: remboursement.commande_numero,
                        nom: remboursement.client,
                        client: remboursement.client,
                        // Les autres détails de la commande (totalFacture, totalPaye) devront être récupérés si nécessaire
                    }}
                    onClose={() => setShowCommandeModal(false)}
                />
            )}
        </>
    );
}

export default RemboursementPane;
