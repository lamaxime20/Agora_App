import { useState } from "react";
import { X, CheckCircle } from "lucide-react";

function FormNouvelAbonnement({ onClose }) {
    const [dateDebut, setDateDebut]     = useState("");
    const [montant, setMontant]         = useState("");
    const [nomService, setNomService]   = useState("");
    const [fournisseur, setFournisseur] = useState("");
    const [submitting, setSubmitting]   = useState(false);
    const [success, setSuccess]         = useState(false);
    const [error, setError]             = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!dateDebut || !montant || !nomService.trim() || !fournisseur.trim()) {
            setError("Veuillez remplir tous les champs requis.");
            return;
        }
        if (parseFloat(montant) <= 0) {
            setError("Le montant doit être supérieur à 0.");
            return;
        }

        setSubmitting(true);
        await new Promise(r => setTimeout(r, 800));
        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => { onClose(); }, 1200);
    };

    return (
        <div className="finAbo-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="abo-form-title">
            <div className="finAbo-modal__panel">
                <div className="finAbo-modal__header">
                    <h2 className="finAbo-modal__title" id="abo-form-title">
                        Nouvel abonnement
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

                {success ? (
                    <div className="finAbo-modal__body" style={{ alignItems: "center", padding: "var(--space-8)" }}>
                        <CheckCircle size={48} style={{ color: "var(--color-success)" }} aria-hidden="true" />
                        <p style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-success)" }}>
                            Abonnement enregistré avec succès !
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
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
                                <input id="abo-nom" type="text" className="app-input" value={nomService} onChange={e => setNomService(e.target.value)} placeholder="Ex : Hébergement Cloud, Suite Office…" required />
                            </div>

                            <div className="finAbo-form__field">
                                <label className="finAbo-form__label" htmlFor="abo-fournisseur">
                                    Fournisseur <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <input id="abo-fournisseur" type="text" className="app-input" value={fournisseur} onChange={e => setFournisseur(e.target.value)} placeholder="Ex : AWS, Google, Microsoft…" required />
                            </div>

                            <div className="finAbo-form__field">
                                <label className="finAbo-form__label" htmlFor="abo-debut">
                                    Date de début <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <input id="abo-debut" type="date" className="app-input" value={dateDebut} onChange={e => setDateDebut(e.target.value)} required />
                            </div>

                            <div className="finAbo-form__field">
                                <label className="finAbo-form__label" htmlFor="abo-montant">
                                    Montant mensuel (FCFA) <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <input id="abo-montant" type="number" className="app-input" value={montant} onChange={e => setMontant(e.target.value)} min="1" step="100" required />
                            </div>
                        </div>

                        <div className="finAbo-modal__footer">
                            <button className="app-button app-button--ghost" onClick={onClose} type="button" disabled={submitting}>
                                Annuler
                            </button>
                            <button className="app-button app-button--primary" type="submit" disabled={submitting}>
                                {submitting ? "Enregistrement…" : "Confirmer"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default FormNouvelAbonnement;
