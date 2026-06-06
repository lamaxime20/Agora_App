import { X } from "lucide-react";

function AbonnementPane({ abonnement, onClose }) {
    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));

    const actif = !abonnement.dateFin;

    return (
        <>
            <div
                className="finAbo-drawer__overlay"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finAbo-drawer"
                role="complementary"
                aria-label={`Détails de l'abonnement ${abonnement.nomService}`}
            >
                <div className="finAbo-drawer__handle">
                    <div className="finAbo-drawer__handle-bar" />
                </div>

                <div className="finAbo-drawer__header">
                    <h2 className="finAbo-drawer__title">{abonnement.nomService}</h2>
                    <button
                        className="finAbo-drawer__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finAbo-drawer__body">
                    <section>
                        <p className="finAbo-detail__section-label">Informations</p>
                        <div className="finAbo-detail__row">
                            <span className="finAbo-detail__key">Référence</span>
                            <span className="finAbo-detail__val">{abonnement.id}</span>
                        </div>
                        <div className="finAbo-detail__row">
                            <span className="finAbo-detail__key">Fournisseur</span>
                            <span className="finAbo-detail__val">{abonnement.fournisseur}</span>
                        </div>
                        <div className="finAbo-detail__row">
                            <span className="finAbo-detail__key">Montant mensuel</span>
                            <span className="finAbo-detail__val finAbo-detail__val--amount" style={{ color: "var(--color-error)" }}>
                                {formatMontant(abonnement.montantMensuel)}
                            </span>
                        </div>
                        <div className="finAbo-detail__row">
                            <span className="finAbo-detail__key">Date de début</span>
                            <span className="finAbo-detail__val">{formatDate(abonnement.dateDebut)}</span>
                        </div>
                        {abonnement.dateFin && (
                            <div className="finAbo-detail__row">
                                <span className="finAbo-detail__key">Date de résiliation</span>
                                <span className="finAbo-detail__val">{formatDate(abonnement.dateFin)}</span>
                            </div>
                        )}
                        <div className="finAbo-detail__row">
                            <span className="finAbo-detail__key">Statut</span>
                            <span className="finAbo-detail__val">
                                <span className={`fin-badge ${actif ? "fin-badge--success" : "fin-badge--neutral"}`}>
                                    {actif ? "Actif" : "Résilié"}
                                </span>
                            </span>
                        </div>
                    </section>
                </div>

                <div className="finAbo-drawer__footer">
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

export default AbonnementPane;
