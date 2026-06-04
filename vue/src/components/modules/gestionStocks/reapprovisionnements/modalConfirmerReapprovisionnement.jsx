import { useState, useRef } from "react";
import { X, ShieldCheck, Eye, EyeOff, Check } from "lucide-react";
import "../../../../assets/styles/components/modules/gestionStocks/modalSecuriteReapprovisionnement.css";

function ModalConfirmerReapprovisionnement({ item, onClose }) {
    const [motDePasse, setMotDePasse]   = useState("");
    const [afficher, setAfficher]       = useState(false);
    const [erreur, setErreur]           = useState("");
    const [submitting, setSubmitting]   = useState(false);
    const [success, setSuccess]         = useState(false);
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
            setTimeout(onClose, 1600);
        }, 1400);
    };

    if (success) {
        return (
            <div className="modalSecurite-overlay">
                <div className="modalSecurite-panel" role="dialog" aria-modal="true">
                    <div className="modalSecurite-feedback">
                        <div className="modalSecurite-feedback__icon modalSecurite-feedback__icon--success">
                            <Check size={28} aria-hidden="true" />
                        </div>
                        <p className="modalSecurite-feedback__text">Réapprovisionnement confirmé. Le stock a été mis à jour.</p>
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
                aria-labelledby="modalConfirmer-title"
            >
                {/* ─── Header ──────────────── */}
                <div className="modalSecurite-header">
                    <div className="modalSecurite-header__icon modalSecurite-header__icon--primary">
                        <ShieldCheck size={20} aria-hidden="true" />
                    </div>
                    <div className="modalSecurite-header__text">
                        <h2 className="modalSecurite-title" id="modalConfirmer-title">
                            Confirmer la réception
                        </h2>
                        <p className="modalSecurite-ref">{item.reference} — {item.fournisseur}</p>
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
                        <div className="modalSecurite-recap">
                            <p className="modalSecurite-recap__line">
                                <span>Montant total</span>
                                <strong>{item.montant_total?.toLocaleString("fr-FR")} FCFA</strong>
                            </p>
                            <p className="modalSecurite-recap__line">
                                <span>Articles</span>
                                <strong>{item.lignes?.length} ligne{item.lignes?.length > 1 ? "s" : ""}</strong>
                            </p>
                        </div>

                        <p className="modalSecurite-info">
                            Saisissez votre mot de passe pour valider définitivement la réception.
                            Le stock sera mis à jour immédiatement.
                        </p>

                        <div className="modalSecurite-field">
                            <label className="modalSecurite-label" htmlFor="mdp-confirmation">
                                Mot de passe <span aria-hidden="true">*</span>
                            </label>
                            <div className="modalSecurite-password-wrap">
                                <input
                                    id="mdp-confirmation"
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
                                    className="modalSecurite-toggle-pass"
                                    onClick={() => setAfficher(v => !v)}
                                    aria-label={afficher ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    disabled={submitting}
                                >
                                    {afficher
                                        ? <EyeOff size={16} aria-hidden="true" />
                                        : <Eye size={16} aria-hidden="true" />
                                    }
                                </button>
                            </div>
                            {erreur && (
                                <span className="modalSecurite-field__error" role="alert">
                                    {erreur}
                                </span>
                            )}
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
                            className="app-button app-button--primary modalSecurite-btn--confirm"
                            disabled={submitting || !motDePasse.trim()}
                        >
                            {submitting ? (
                                <>
                                    <span className="modalSecurite-spinner modalSecurite-spinner--light" aria-hidden="true" />
                                    Validation en cours…
                                </>
                            ) : "Valider définitivement"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalConfirmerReapprovisionnement;
