import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

function CouperAbonnementPane({ abonnement, onConfirm, onClose }) {
    const [fondsMois, setFondsMois] = useState("non");
    const [loading, setLoading]     = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const handleConfirm = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 700));
        setLoading(false);
        onConfirm(abonnement);
    };

    return (
        <div className="finAbo-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="couper-abo-title">
            <div className="finAbo-modal__panel">
                <div className="finAbo-modal__header">
                    <h2 className="finAbo-modal__title" id="couper-abo-title">
                        Résilier l'abonnement
                    </h2>
                    <button
                        className="finAbo-modal__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finAbo-modal__body">
                    <div style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-4)", background: "rgba(231,76,60,0.06)", borderRadius: "var(--radius-xl)", border: "1px solid rgba(231,76,60,0.2)", alignItems: "flex-start" }}>
                        <AlertTriangle size={20} style={{ color: "var(--color-error)", flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
                        <div>
                            <p style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-text)", margin: "0 0 var(--space-1)", fontSize: "var(--text-sm)" }}>
                                {abonnement.nomService}
                            </p>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                                {abonnement.fournisseur} — {formatMontant(abonnement.montantMensuel)}/mois
                            </p>
                        </div>
                    </div>

                    <div>
                        <p style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", color: "var(--color-text)", marginBottom: "var(--space-3)" }}>
                            Gestion du mois en cours
                        </p>
                        <div className="finAbo-radio-group" role="radiogroup" aria-labelledby="fondsMois-legend">
                            <label className="finAbo-radio-option">
                                <input
                                    type="radio"
                                    name="fondsMois"
                                    value="oui"
                                    checked={fondsMois === "oui"}
                                    onChange={() => setFondsMois("oui")}
                                    aria-label="Prélever le montant du mois en cours"
                                />
                                <div>
                                    <p className="finAbo-radio-option__label">Prélever le mois en cours</p>
                                    <p className="finAbo-radio-option__desc">Le montant de {formatMontant(abonnement.montantMensuel)} sera déduit.</p>
                                </div>
                            </label>
                            <label className="finAbo-radio-option">
                                <input
                                    type="radio"
                                    name="fondsMois"
                                    value="non"
                                    checked={fondsMois === "non"}
                                    onChange={() => setFondsMois("non")}
                                    aria-label="Ne pas prélever le mois en cours"
                                />
                                <div>
                                    <p className="finAbo-radio-option__label">Ne pas prélever le mois en cours</p>
                                    <p className="finAbo-radio-option__desc">Aucun prélèvement pour la période en cours.</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="finAbo-modal__footer">
                    <button className="app-button app-button--ghost" onClick={onClose} type="button" disabled={loading}>
                        Annuler
                    </button>
                    <button
                        className="app-button"
                        style={{ background: "var(--color-error)", color: "#fff", border: "none" }}
                        onClick={handleConfirm}
                        type="button"
                        disabled={loading}
                    >
                        {loading ? "Résiliation…" : "Confirmer la résiliation"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CouperAbonnementPane;
