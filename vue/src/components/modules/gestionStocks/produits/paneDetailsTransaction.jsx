import { X, TrendingUp, TrendingDown, PackagePlus, Truck } from "lucide-react";
import "../../../../assets/styles/components/modules/gestionStocks/paneDetailsTransaction.css";

const typeConfig = {
    ravitaillement: { label: "Ravitaillement", icon: TrendingUp,  mod: "ravitaillement" },
    perte:          { label: "Perte",           icon: TrendingDown, mod: "perte"         },
    livraison:      { label: "Livraison",       icon: Truck,        mod: "livraison"     },
    ajout:          { label: "Ajout produit",   icon: PackagePlus,  mod: "ajout"         },
};

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function PaneDetailsTransaction({ transaction, onClose }) {
    const config   = typeConfig[transaction.type] ?? typeConfig.ajout;
    const Icon     = config.icon;
    const isPlus   = (transaction.variation ?? 0) > 0;

    return (
        <div className="paneTransaction-overlay" role="presentation">
            <aside
                className="paneTransaction-panel"
                aria-label="Détails de la transaction"
            >
                <div className="paneTransaction-header">
                    <h2 className="paneTransaction-title">Détails</h2>
                    <button
                        className="paneTransaction-close"
                        onClick={onClose}
                        aria-label="Fermer le volet"
                        type="button"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className="paneTransaction-body">
                    {/* Type */}
                    <span className={`paneTransaction-type paneTransaction-type--${config.mod}`}>
                        <Icon size={14} aria-hidden="true" />
                        {config.label}
                    </span>

                    {/* Produit */}
                    <section className="paneTransaction-section">
                        <h3 className="paneTransaction-section__title">Produit</h3>
                        <div className="paneTransaction-row">
                            <span className="paneTransaction-row__label">Nom</span>
                            <span className="paneTransaction-row__value">{transaction.produit.nom}</span>
                        </div>
                        <div className="paneTransaction-row">
                            <span className="paneTransaction-row__label">Référence</span>
                            <span className="paneTransaction-row__value">{transaction.produit.reference}</span>
                        </div>
                        <div className="paneTransaction-row">
                            <span className="paneTransaction-row__label">Catégorie</span>
                            <span className="paneTransaction-row__value">{transaction.produit.categorie}</span>
                        </div>
                    </section>

                    {/* Impact stock */}
                    <section className="paneTransaction-section">
                        <h3 className="paneTransaction-section__title">Impact sur le stock</h3>
                        <div className="paneTransaction-row">
                            <span className="paneTransaction-row__label">Quantité</span>
                            <span className={`paneTransaction-row__value paneTransaction-row__value--${isPlus ? "plus" : "minus"}`}>
                                {isPlus ? "+" : ""}{transaction.variation}
                            </span>
                        </div>
                        <div className="paneTransaction-row">
                            <span className="paneTransaction-row__label">Stock avant</span>
                            <span className="paneTransaction-row__value">{transaction.stock_avant}</span>
                        </div>
                        <div className="paneTransaction-row">
                            <span className="paneTransaction-row__label">Stock après</span>
                            <span className="paneTransaction-row__value">{transaction.stock_apres}</span>
                        </div>
                        {transaction.montant != null && (
                            <div className="paneTransaction-row">
                                <span className="paneTransaction-row__label">Montant</span>
                                <span className="paneTransaction-row__value">
                                    {transaction.montant.toLocaleString("fr-FR")} FCFA
                                </span>
                            </div>
                        )}
                        {transaction.raison_perte && (
                            <div className="paneTransaction-row">
                                <span className="paneTransaction-row__label">Raison</span>
                                <span className="paneTransaction-row__value">{transaction.raison_perte}</span>
                            </div>
                        )}
                    </section>

                    {/* Méta */}
                    <section className="paneTransaction-section">
                        <h3 className="paneTransaction-section__title">Informations</h3>
                        <div className="paneTransaction-row">
                            <span className="paneTransaction-row__label">Date</span>
                            <span className="paneTransaction-row__value">{formatDate(transaction.date)}</span>
                        </div>
                        <div className="paneTransaction-row">
                            <span className="paneTransaction-row__label">Utilisateur</span>
                            <span className="paneTransaction-row__value">{transaction.utilisateur.nom}</span>
                        </div>
                        {transaction.commande_id && (
                            <div className="paneTransaction-row">
                                <span className="paneTransaction-row__label">Commande</span>
                                <span className="paneTransaction-row__value">#{transaction.commande_id}</span>
                            </div>
                        )}
                    </section>

                    {/* Note */}
                    {transaction.note && (
                        <section className="paneTransaction-section">
                            <h3 className="paneTransaction-section__title">Note</h3>
                            <p className="paneTransaction-note">{transaction.note}</p>
                        </section>
                    )}
                </div>
            </aside>
        </div>
    );
}

export default PaneDetailsTransaction;
