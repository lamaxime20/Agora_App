import { X, Package } from "lucide-react";
import DeliveryTimeline from "./DeliveryTimeline.jsx";
import { getStatutBadge, formatMontant, formatDate } from "../../../services/livraison.js";
import "../../../assets/styles/components/modules/livraison/DeliveryDrawer.css";

function DeliveryDrawer({ livraison, onClose }) {
    if (!livraison) return null;

    const badge = getStatutBadge(livraison.statut);

    return (
        <>
            <div className="deliveryDrawer-backdrop" onClick={onClose} aria-hidden="true" />
            <aside
                className="deliveryDrawer-root"
                role="complementary"
                aria-label="Détails de la livraison"
            >
                <div className="deliveryDrawer-header">
                    <div className="deliveryDrawer-header__info">
                        <span className="deliveryDrawer-header__numero">{livraison.numero}</span>
                        <span className={`liv-badge liv-badge--${badge.variant}`}>{badge.label}</span>
                    </div>
                    <button
                        type="button"
                        className="deliveryDrawer-header__close"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className="deliveryDrawer-body">
                    {/* ── Informations livraison ── */}
                    <section className="deliveryDrawer-section">
                        <h3 className="deliveryDrawer-section__title">Informations livraison</h3>
                        <dl className="deliveryDrawer-dl">
                            <dt>Livreur</dt>
                            <dd>{livraison.livreur ?? "—"}</dd>
                            <dt>Date de création</dt>
                            <dd>{formatDate(livraison.dateCreation)}</dd>
                            <dt>Date de lancement</dt>
                            <dd>{formatDate(livraison.dateLancement)}</dd>
                            <dt>Date de livraison</dt>
                            <dd>{formatDate(livraison.dateLivraison)}</dd>
                            {livraison.motif && <>
                                <dt>Motif</dt>
                                <dd className="deliveryDrawer-dl__motif">{livraison.motif}</dd>
                            </>}
                        </dl>
                    </section>

                    {/* ── Informations commande ── */}
                    <section className="deliveryDrawer-section">
                        <h3 className="deliveryDrawer-section__title">Informations commande</h3>
                        <dl className="deliveryDrawer-dl">
                            <dt>Commande</dt>
                            <dd>{livraison.commande ?? "—"}</dd>
                            <dt>Client</dt>
                            <dd>{livraison.client ?? "—"}</dd>
                            {livraison.telephone && <><dt>Téléphone</dt><dd>{livraison.telephone}</dd></>}
                            {livraison.adresse && <><dt>Adresse</dt><dd>{livraison.adresse}</dd></>}
                            <dt>Montant</dt>
                            <dd className="deliveryDrawer-dl__amount">{formatMontant(livraison.montant)}</dd>
                        </dl>
                    </section>

                    {/* ── Produits ── */}
                    {livraison.produits?.length > 0 && (
                        <section className="deliveryDrawer-section">
                            <h3 className="deliveryDrawer-section__title">Produits</h3>
                            <ul className="deliveryDrawer-produits">
                                {livraison.produits.map((p, i) => (
                                    <li key={i} className="deliveryDrawer-produit">
                                        <Package size={14} className="deliveryDrawer-produit__icon" aria-hidden="true" />
                                        <span className="deliveryDrawer-produit__nom">{p.nom}</span>
                                        <span className="deliveryDrawer-produit__qty">×{p.quantite}</span>
                                        <span className="deliveryDrawer-produit__prix">{formatMontant(p.prix)}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* ── Timeline ── */}
                    <section className="deliveryDrawer-section">
                        <h3 className="deliveryDrawer-section__title">Historique</h3>
                        <DeliveryTimeline livraison={livraison} />
                    </section>
                </div>
            </aside>
        </>
    );
}

export default DeliveryDrawer;
