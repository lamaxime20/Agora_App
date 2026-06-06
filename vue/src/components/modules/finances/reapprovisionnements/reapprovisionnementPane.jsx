import { useState } from "react";
import { X, List } from "lucide-react";
import DetailsArticlesReapprovisionnementModal from "./DetailsArticlesReapprovisionnementModal.jsx";

const BADGE_MAP = {
    "Livré et stocké":             "fin-badge--success",
    "En cours d'acheminement":     "fin-badge--info",
    "En attente de confirmation":  "fin-badge--warning",
};

function ReapprovisionnementPane({ reappro, onClose }) {
    const [showArticlesModal, setShowArticlesModal] = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));

    return (
        <>
            <div
                className="finReapp-drawer__overlay"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finReapp-drawer"
                role="complementary"
                aria-label={`Détails du réapprovisionnement ${reappro.id}`}
            >
                <div className="finReapp-drawer__handle">
                    <div className="finReapp-drawer__handle-bar" />
                </div>

                <div className="finReapp-drawer__header">
                    <h2 className="finReapp-drawer__title">Réapprovisionnement {reappro.id}</h2>
                    <button
                        className="finReapp-drawer__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finReapp-drawer__body">
                    <section>
                        <p className="finReapp-detail__section-label">Informations commande</p>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Référence</span>
                            <span className="finReapp-detail__val">{reappro.id}</span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Date d'émission</span>
                            <span className="finReapp-detail__val">{formatDate(reappro.date)}</span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Montant total</span>
                            <span className="finReapp-detail__val finReapp-detail__val--amount">
                                {formatMontant(reappro.montantTotal)}
                            </span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Statut logistique</span>
                            <span className="finReapp-detail__val">
                                <span className={`fin-badge ${BADGE_MAP[reappro.statut] || "fin-badge--neutral"}`}>
                                    {reappro.statut}
                                </span>
                            </span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Nombre d'articles</span>
                            <span className="finReapp-detail__val">{reappro.articles.length} ligne{reappro.articles.length > 1 ? "s" : ""}</span>
                        </div>
                    </section>

                    <section>
                        <p className="finReapp-detail__section-label">Fournisseur</p>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Nom</span>
                            <span className="finReapp-detail__val">{reappro.fournisseur.nom}</span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Contact</span>
                            <span className="finReapp-detail__val">{reappro.fournisseur.contact}</span>
                        </div>
                    </section>
                </div>

                <div className="finReapp-drawer__footer">
                    <button
                        className="app-button app-button--ghost"
                        style={{ width: "100%" }}
                        onClick={() => setShowArticlesModal(true)}
                        type="button"
                    >
                        <List size={16} aria-hidden="true" />
                        Voir la liste des articles
                    </button>
                </div>
            </aside>

            {showArticlesModal && (
                <DetailsArticlesReapprovisionnementModal
                    articles={reappro.articles}
                    commandeId={reappro.id}
                    onClose={() => setShowArticlesModal(false)}
                />
            )}
        </>
    );
}

export default ReapprovisionnementPane;
