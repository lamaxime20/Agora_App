import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { reactiverAbonnement } from "../../../../services/financesP4.js";

function ReactiverAbonnementPane({ abonnement, onClose, onSuccess }) {
    const [payerMoisCourant, setPayerMoisCourant] = useState("non");
    const [loading, setLoading]                   = useState(false);
    const [error, setError]                       = useState("");
    const [done, setDone]                         = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const handleConfirm = async () => {
        setLoading(true);
        setError("");
        try {
            await reactiverAbonnement(abonnement.id, { payerMoisCourant: payerMoisCourant === "oui" });
            setDone(true);
            setTimeout(() => { onSuccess?.(); onClose(); }, 1400);
        } catch {
            setError("Une erreur est survenue. Veuillez réessayer.");
            setLoading(false);
        }
    };

    return (
        <div className="finAbo-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="reactiver-abo-title">
            <div className="finAbo-modal__panel">
                <div className="finAbo-modal__header">
                    <h2 className="finAbo-modal__title" id="reactiver-abo-title">Réactiver l'abonnement</h2>
                    <button className="finAbo-modal__close" onClick={onClose} aria-label="Fermer" type="button" disabled={loading}>
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {done ? (
                    <div className="finAbo-modal__body" style={{ alignItems: "center", padding: "var(--space-8)" }}>
                        <CheckCircle size={48} style={{ color: "var(--color-success)" }} aria-hidden="true" />
                        <p style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-success)", margin: 0 }}>
                            Abonnement réactivé avec succès !
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="finAbo-modal__body">
                            <div style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)" }}>
                                <p style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-text)", margin: "0 0 var(--space-1)", fontSize: "var(--text-sm)" }}>
                                    {abonnement.nomService}
                                </p>
                                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                                    {abonnement.fournisseur} — {formatMontant(abonnement.montantMensuel)}/mois
                                </p>
                            </div>

                            <div>
                                <p style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", color: "var(--color-text)", marginBottom: "var(--space-3)" }}>
                                    Facturation du mois en cours
                                </p>
                                <div className="finAbo-radio-group" role="radiogroup">
                                    <label className="finAbo-radio-option">
                                        <input type="radio" name="payerCourant" value="oui" checked={payerMoisCourant === "oui"} onChange={() => setPayerMoisCourant("oui")} />
                                        <div>
                                            <p className="finAbo-radio-option__label">Payer le mois en cours immédiatement</p>
                                            <p className="finAbo-radio-option__desc">{formatMontant(abonnement.montantMensuel)} déduits dès la réactivation.</p>
                                        </div>
                                    </label>
                                    <label className="finAbo-radio-option">
                                        <input type="radio" name="payerCourant" value="non" checked={payerMoisCourant === "non"} onChange={() => setPayerMoisCourant("non")} />
                                        <div>
                                            <p className="finAbo-radio-option__label">Ne pas payer maintenant</p>
                                            <p className="finAbo-radio-option__desc">Le premier prélèvement s'appliquera le mois prochain.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", margin: 0 }}>{error}</p>
                            )}
                        </div>

                        <div className="finAbo-modal__footer">
                            <button className="app-button app-button--ghost" onClick={onClose} type="button" disabled={loading}>Annuler</button>
                            <button className="app-button app-button--primary" onClick={handleConfirm} type="button" disabled={loading}>
                                {loading ? "Réactivation…" : "Confirmer la réactivation"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ReactiverAbonnementPane;
