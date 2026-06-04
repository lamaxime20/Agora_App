import { useState, useRef } from "react";
import { X, ShieldAlert, Eye, EyeOff, Check } from "lucide-react";
import "../../../../assets/styles/components/modules/gestionStocks/modalAnnulerPerte.css";

function ModalAnnulerPerte({ item, onClose }) {
    const [motDePasse, setMotDePasse] = useState("");
    const [afficher, setAfficher]     = useState(false);
    const [erreur, setErreur]         = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess]       = useState(false);
    const overlayRef = useRef(null);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current && !submitting) onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!motDePasse.trim()) {
            setErreur("Veuillez saisir votre mot de passe.");
            return;
        }
        setErreur("");
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setSuccess(true);
            setTimeout(onClose, 1500);
        }, 1200);
    };

    if (success) {
        return (
            <div className="modalAnnulerPerte-overlay">
                <div className="modalAnnulerPerte-panel" role="dialog" aria-modal="true">
                    <div className="modalAnnulerPerte-feedback">
                        <div className="modalAnnulerPerte-feedback__icon">
                            <Check size={28} aria-hidden="true" />
                        </div>
                        <p className="modalAnnulerPerte-feedback__text">
                            Perte annulée. Le stock a été restitué.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="modalAnnulerPerte-overlay"
            ref={overlayRef}
            onClick={handleOverlayClick}
        >
            <div
                className="modalAnnulerPerte-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalAnnulerPerte-title"
            >
                {/* ─── Header ──────────────── */}
                <div className="modalAnnulerPerte-header">
                    <div className="modalAnnulerPerte-header__icon">
                        <ShieldAlert size={20} aria-hidden="true" />
                    </div>
                    <div className="modalAnnulerPerte-header__text">
                        <h2 className="modalAnnulerPerte-title" id="modalAnnulerPerte-title">
                            Annuler la perte
                        </h2>
                        <p className="modalAnnulerPerte-ref">
                            {item.reference} — {item.produit?.nom}
                        </p>
                    </div>
                    <button
                        className="modalAnnulerPerte-close"
                        onClick={onClose}
                        type="button"
                        aria-label="Fermer"
                        disabled={submitting}
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* ─── Corps ───────────────── */}
                <form className="modalAnnulerPerte-form" onSubmit={handleSubmit} noValidate>
                    <div className="modalAnnulerPerte-body">
                        <div className="modalAnnulerPerte-recap">
                            <p className="modalAnnulerPerte-recap__line">
                                <span>Quantité à restituer</span>
                                <strong>{item.quantite} {item.produit?.unite}{item.quantite > 1 ? "s" : ""}</strong>
                            </p>
                            <p className="modalAnnulerPerte-recap__line">
                                <span>Valeur restituée</span>
                                <strong>{item.valeur_totale?.toLocaleString("fr-FR")} FCFA</strong>
                            </p>
                        </div>

                        <p className="modalAnnulerPerte-info">
                            Confirmez votre mot de passe pour annuler définitivement cette perte.
                            Le stock sera restitué immédiatement.
                        </p>

                        <div className="modalAnnulerPerte-field">
                            <label className="modalAnnulerPerte-label" htmlFor="annuler-perte-mdp">
                                Mot de passe <span aria-hidden="true">*</span>
                            </label>
                            <div className="modalAnnulerPerte-password-wrap">
                                <input
                                    id="annuler-perte-mdp"
                                    type={afficher ? "text" : "password"}
                                    className={`app-input${erreur ? " app-input--error" : ""}`}
                                    placeholder="Votre mot de passe"
                                    value={motDePasse}
                                    onChange={e => {
                                        setMotDePasse(e.target.value);
                                        if (erreur) setErreur("");
                                    }}
                                    disabled={submitting}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="modalAnnulerPerte-toggle-pass"
                                    onClick={() => setAfficher(v => !v)}
                                    aria-label={afficher ? "Masquer" : "Afficher"}
                                    disabled={submitting}
                                >
                                    {afficher
                                        ? <EyeOff size={15} aria-hidden="true" />
                                        : <Eye size={15} aria-hidden="true" />
                                    }
                                </button>
                            </div>
                            {erreur && (
                                <span className="modalAnnulerPerte-field__error" role="alert">
                                    {erreur}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="modalAnnulerPerte-footer">
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
                            className="app-button modalAnnulerPerte-btn"
                            disabled={submitting || !motDePasse.trim()}
                        >
                            {submitting ? (
                                <>
                                    <span className="modalAnnulerPerte-spinner" aria-hidden="true" />
                                    Annulation…
                                </>
                            ) : "Annuler définitivement"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalAnnulerPerte;
