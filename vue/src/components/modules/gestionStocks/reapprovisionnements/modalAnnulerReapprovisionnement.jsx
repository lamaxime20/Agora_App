import { useState, useRef } from "react";
import { X, AlertTriangle, Check } from "lucide-react";
import { annulerStockRavitaillement } from "../../../../services/gestionStock.js";
import "../../../../assets/styles/components/modules/gestionStocks/modalSecuriteReapprovisionnement.css";

function ModalAnnulerReapprovisionnement({ item, onClose, onSaved }) {
    const [raison, setRaison]         = useState("");
    const [erreur, setErreur]         = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess]       = useState(false);
    const overlayRef = useRef(null);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current && !submitting) onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (raison.trim().length < 10) {
            setErreur("La raison doit contenir au moins 10 caractères.");
            return;
        }
        setErreur("");
        setSubmitting(true);
        annulerStockRavitaillement(item.id, raison.trim())
            .then(() => {
                setSuccess(true);
                onSaved?.();
                setTimeout(onClose, 1500);
            })
            .catch((err) => {
                setErreur(err?.message || "Impossible d'annuler ce réapprovisionnement.");
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    if (success) {
        return (
            <div className="modalSecurite-overlay">
                <div className="modalSecurite-panel" role="dialog" aria-modal="true">
                    <div className="modalSecurite-feedback">
                        <div className="modalSecurite-feedback__icon modalSecurite-feedback__icon--success">
                            <Check size={28} aria-hidden="true" />
                        </div>
                        <p className="modalSecurite-feedback__text">Réapprovisionnement annulé avec succès.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="modalSecurite-overlay"
            ref={overlayRef}
            onClick={handleOverlayClick}
        >
            <div
                className="modalSecurite-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalAnnuler-title"
            >
                {/* ─── Header ──────────────── */}
                <div className="modalSecurite-header">
                    <div className="modalSecurite-header__icon modalSecurite-header__icon--danger">
                        <AlertTriangle size={20} aria-hidden="true" />
                    </div>
                    <div className="modalSecurite-header__text">
                        <h2 className="modalSecurite-title" id="modalAnnuler-title">
                            Annuler le réapprovisionnement
                        </h2>
                        <p className="modalSecurite-ref">{item.reference}</p>
                    </div>
                    <button
                        className="modalSecurite-close"
                        onClick={onClose}
                        type="button"
                        aria-label="Fermer"
                        disabled={submitting}
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* ─── Corps ───────────────── */}
                <form className="modalSecurite-form" onSubmit={handleSubmit} noValidate>
                    <div className="modalSecurite-body">
                        <p className="modalSecurite-warning">
                            Cette action est irréversible. Le stock ne sera pas modifié.
                        </p>

                        <div className="modalSecurite-field">
                            <label className="modalSecurite-label" htmlFor="raison-annulation">
                                Raison de l'annulation <span aria-hidden="true">*</span>
                            </label>
                            <textarea
                                id="raison-annulation"
                                className={`app-input modalSecurite-textarea${erreur ? " app-input--error" : ""}`}
                                placeholder="Décrivez la raison de cette annulation (minimum 10 caractères)…"
                                value={raison}
                                onChange={e => {
                                    setRaison(e.target.value);
                                    if (erreur) setErreur("");
                                }}
                                rows={4}
                                disabled={submitting}
                                aria-describedby={erreur ? "raison-error" : undefined}
                            />
                            {erreur && (
                                <span id="raison-error" className="modalSecurite-field__error" role="alert">
                                    {erreur}
                                </span>
                            )}
                            <span className="modalSecurite-counter">
                                {raison.trim().length} / 10 min.
                            </span>
                        </div>
                    </div>

                    <div className="modalSecurite-footer">
                        <button
                            type="button"
                            className="app-button app-button--ghost"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Retour
                        </button>
                        <button
                            type="submit"
                            className="app-button modalSecurite-btn--danger"
                            disabled={submitting || raison.trim().length < 10}
                        >
                            {submitting ? (
                                <>
                                    <span className="modalSecurite-spinner" aria-hidden="true" />
                                    Annulation en cours…
                                </>
                            ) : "Confirmer l'annulation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalAnnulerReapprovisionnement;
