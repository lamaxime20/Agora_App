import { X } from "lucide-react";

function DetailsArticlesReapprovisionnementModal({ articles, commandeId, onClose }) {
    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const total = articles.reduce((s, a) => s + a.quantite * a.prixUnitaire, 0);

    return (
        <div className="finReapp-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="articles-modal-title">
            <div className="finReapp-modal__panel">
                <div className="finReapp-modal__header">
                    <h2 className="finReapp-modal__title" id="articles-modal-title">
                        Articles — {commandeId}
                    </h2>
                    <button
                        className="finReapp-modal__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finReapp-modal__body" style={{ padding: 0 }}>
                    <div style={{ overflowX: "auto" }}>
                        <table className="finReapp-articles-table" aria-label={`Articles de la commande ${commandeId}`}>
                            <thead>
                                <tr>
                                    <th scope="col">Désignation</th>
                                    <th scope="col">Quantité</th>
                                    <th scope="col">Prix unitaire</th>
                                    <th scope="col">Sous-total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.map((a, i) => (
                                    <tr key={i}>
                                        <td>{a.nom}</td>
                                        <td style={{ color: "var(--color-text-muted)" }}>{a.quantite}</td>
                                        <td style={{ color: "var(--color-text-muted)" }}>{formatMontant(a.prixUnitaire)}</td>
                                        <td className="finReapp-articles-table__amount">{formatMontant(a.quantite * a.prixUnitaire)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ padding: "var(--space-4) var(--space-6)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text)" }}>Total</span>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", fontSize: "var(--text-lg)", color: "var(--color-primary)" }}>
                            {formatMontant(total)}
                        </span>
                    </div>
                </div>

                <div className="finReapp-modal__footer">
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

export default DetailsArticlesReapprovisionnementModal;
