import { useState } from "react";
import { X, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { creerAbonnement } from "../../../../services/financesP4.js";

function FormNouvelAbonnement({ onClose, onSuccess }) {
    const [step, setStep]           = useState(1);
    const [nomService, setNomService]   = useState("");
    const [fournisseur, setFournisseur] = useState("");
    const [dateDebut, setDateDebut]     = useState("");
    const [montant, setMontant]         = useState("");
    const [submitting, setSubmitting]   = useState(false);
    const [success, setSuccess]         = useState(false);
    const [error, setError]             = useState("");

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(Number(n));

    const formatDate = (d) =>
        d ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d)) : "—";

    const validateStep1 = () => {
        if (!nomService.trim() || !fournisseur.trim() || !dateDebut || !montant) {
            setError("Veuillez remplir tous les champs.");
            return false;
        }
        if (parseFloat(montant) <= 0) {
            setError("Le montant doit être supérieur à 0.");
            return false;
        }
        setError("");
        return true;
    };

    const handleNext = () => {
        if (validateStep1()) setStep(2);
    };

    const handleConfirm = async () => {
        setSubmitting(true);
        setError("");
        try {
            await creerAbonnement({ nomService, fournisseur, dateDebut, montantMensuel: parseFloat(montant) });
            setSuccess(true);
            setTimeout(() => { onSuccess?.(); onClose(); }, 1400);
        } catch {
            setError("Une erreur est survenue. Veuillez réessayer.");
            setSubmitting(false);
        }
    };

    return (
        <div className="finAbo-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="abo-form-title">
            <div className="finAbo-modal__panel">
                <div className="finAbo-modal__header">
                    <h2 className="finAbo-modal__title" id="abo-form-title">
                        {success ? "Abonnement créé" : step === 1 ? "Nouvel abonnement" : "Confirmer l'abonnement"}
                    </h2>
                    <button className="finAbo-modal__close" onClick={onClose} aria-label="Fermer" type="button" disabled={submitting}>
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {success ? (
                    <div className="finAbo-modal__body" style={{ alignItems: "center", padding: "var(--space-8)" }}>
                        <CheckCircle size={48} style={{ color: "var(--color-success)" }} aria-hidden="true" />
                        <p style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-success)", margin: 0 }}>
                            Abonnement enregistré avec succès !
                        </p>
                    </div>
                ) : step === 1 ? (
                    <>
                        <div className="finAbo-modal__body">
                            {error && (
                                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", background: "rgba(231,76,60,0.07)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(231,76,60,0.2)", margin: 0 }}>
                                    {error}
                                </p>
                            )}
                            <div className="finAbo-form__field">
                                <label className="finAbo-form__label" htmlFor="abo-nom">
                                    Nom du service <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <input id="abo-nom" type="text" className="app-input" value={nomService} onChange={e => setNomService(e.target.value)} placeholder="Ex : Hébergement Cloud, Suite Office…" />
                            </div>
                            <div className="finAbo-form__field">
                                <label className="finAbo-form__label" htmlFor="abo-fournisseur">
                                    Fournisseur <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <input id="abo-fournisseur" type="text" className="app-input" value={fournisseur} onChange={e => setFournisseur(e.target.value)} placeholder="Ex : AWS, Google, Microsoft…" />
                            </div>
                            <div className="finAbo-form__field">
                                <label className="finAbo-form__label" htmlFor="abo-debut">
                                    Date de début <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <input id="abo-debut" type="date" className="app-input" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
                            </div>
                            <div className="finAbo-form__field">
                                <label className="finAbo-form__label" htmlFor="abo-montant">
                                    Montant mensuel (FCFA) <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <input id="abo-montant" type="number" className="app-input" value={montant} onChange={e => setMontant(e.target.value)} min="1" step="100" placeholder="Ex : 500000" />
                            </div>
                        </div>
                        <div className="finAbo-modal__footer">
                            <button className="app-button app-button--ghost" onClick={onClose} type="button">Annuler</button>
                            <button className="app-button app-button--primary" onClick={handleNext} type="button">
                                Suivant
                                <ChevronRight size={16} aria-hidden="true" />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="finAbo-modal__body">
                            {error && (
                                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", margin: 0 }}>{error}</p>
                            )}
                            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: 0 }}>
                                Vérifiez les informations avant de confirmer.
                            </p>
                            <div style={{ background: "var(--color-surface-alt)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
                                {[
                                    ["Service",          nomService],
                                    ["Fournisseur",      fournisseur],
                                    ["Date de début",    formatDate(dateDebut)],
                                    ["Montant mensuel",  formatMontant(montant)],
                                ].map(([k, v]) => (
                                    <div key={k} className="finAbo-detail__row" style={{ padding: "var(--space-3) var(--space-4)" }}>
                                        <span className="finAbo-detail__key">{k}</span>
                                        <span className="finAbo-detail__val">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="finAbo-modal__footer">
                            <button className="app-button app-button--ghost" onClick={() => setStep(1)} type="button" disabled={submitting}>
                                <ChevronLeft size={16} aria-hidden="true" />
                                Modifier
                            </button>
                            <button className="app-button app-button--primary" onClick={handleConfirm} type="button" disabled={submitting}>
                                {submitting ? "Enregistrement…" : "Confirmer"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default FormNouvelAbonnement;
