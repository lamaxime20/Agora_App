import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { refuserReappro } from "../../../../services/financesP4.js";

const MIN_CHARS = 20;

function RefuserReapprovisionnementModal({ reappro, onClose, onSuccess }) {
    const [motif, setMotif]           = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState("");
    const [done, setDone]             = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const valid = motif.trim().length >= MIN_CHARS;

    const handleConfirm = async () => {
        if (!valid) {
            setError(`Le motif doit contenir au moins ${MIN_CHARS} caractères.`);
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            await refuserReappro(reappro.id, { motif: motif.trim() });
            setDone(true);
            setTimeout(() => { onSuccess(); onClose(); }, 1400);
        } catch {
            setError("Une erreur est survenue. Veuillez réessayer.");
            setSubmitting(false);
        }
    };

    return (
        <div className="finReapp-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="refuser-reappro-title">
            <div className="finReapp-modal__panel">
                <div className="finReapp-modal__header">
                    <h2 className="finReapp-modal__title" id="refuser-reappro-title">
                        Refus du réapprovisionnement
                    </h2>
                    <button className="finReapp-modal__close" onClick={onClose} aria-label="Fermer" type="button" disabled={submitting}>
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {done ? (
                    <div className="finReapp-modal__body" style={{ alignItems: "center", padding: "var(--space-8)" }}>
                        <CheckCircle size={48} style={{ color: "var(--color-success)" }} aria-hidden="true" />
                        <p style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-text)", margin: 0 }}>
                            Refus enregistré. Le service Gestion Stock a été notifié.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="finReapp-modal__body">
                            {/* Product summary */}
                            <div className="finReapp-modal__info-block">
                                <div className="finReapp-detail__row">
                                    <span className="finReapp-detail__key">Produit</span>
                                    <span className="finReapp-detail__val">{reappro.produit}</span>
                                </div>
                                <div className="finReapp-detail__row">
                                    <span className="finReapp-detail__key">Montant</span>
                                    <span className="finReapp-detail__val">{formatMontant(reappro.montant_a_depenser)}</span>
                                </div>
                                <div className="finReapp-detail__row" style={{ borderBottom: "none" }}>
                                    <span className="finReapp-detail__key">Demandeur</span>
                                    <span className="finReapp-detail__val">{reappro.demandeur}</span>
                                </div>
                            </div>

                            {/* Motif textarea */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <label
                                        htmlFor="refus-motif"
                                        style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text)" }}
                                    >
                                        Motif du refus <span style={{ color: "var(--color-error)" }}>*</span>
                                    </label>
                                    <span style={{
                                        fontSize: "var(--text-xs)",
                                        color: valid ? "var(--color-success)" : "var(--color-text-muted)",
                                        fontVariantNumeric: "tabular-nums"
                                    }}>
                                        {motif.trim().length}/{MIN_CHARS} min.
                                    </span>
                                </div>
                                <textarea
                                    id="refus-motif"
                                    className="app-input"
                                    style={{ minHeight: "100px", resize: "vertical", lineHeight: "1.5" }}
                                    value={motif}
                                    onChange={e => setMotif(e.target.value)}
                                    placeholder="Expliquez clairement la raison du refus pour le service concerné…"
                                />
                                {!valid && motif.length > 0 && (
                                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                                        Encore {MIN_CHARS - motif.trim().length} caractère{MIN_CHARS - motif.trim().length > 1 ? "s" : ""} requis.
                                    </p>
                                )}
                                {error && (
                                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-error)", margin: 0 }}>{error}</p>
                                )}
                            </div>
                        </div>

                        <div className="finReapp-modal__footer">
                            <button className="app-button app-button--ghost" onClick={onClose} type="button" disabled={submitting}>
                                Annuler
                            </button>
                            <button
                                className="app-button app-button--primary"
                                onClick={handleConfirm}
                                type="button"
                                disabled={submitting || !valid}
                            >
                                {submitting ? "Enregistrement…" : "Confirmer le refus"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default RefuserReapprovisionnementModal;
