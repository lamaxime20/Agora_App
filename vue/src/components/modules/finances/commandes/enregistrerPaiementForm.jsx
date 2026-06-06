import { useState } from "react";
import { X, CheckCircle } from "lucide-react";

const MODES = ["carte bancaire", "virement bancaire", "espèces", "chèque", "mobile money"];

function EnregistrerPaiementForm({ commande, onClose }) {
    const [montant, setMontant]               = useState("");
    const [modePaiement, setModePaiement]     = useState("virement bancaire");
    const [reference, setReference]           = useState("");
    const [submitting, setSubmitting]         = useState(false);
    const [success, setSuccess]               = useState(false);
    const [error, setError]                   = useState("");

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const resteAPayer = commande.total - commande.paye;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!montant || parseFloat(montant) <= 0) {
            setError("Veuillez saisir un montant valide.");
            return;
        }
        if (parseFloat(montant) > resteAPayer) {
            setError(`Le montant ne peut pas dépasser le reste à payer (${formatMontant(resteAPayer)}).`);
            return;
        }
        if (modePaiement !== "espèces" && !reference.trim()) {
            setError("La référence de transaction est obligatoire pour ce mode de paiement.");
            return;
        }

        setSubmitting(true);
        await new Promise(r => setTimeout(r, 800));
        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => { onClose(); }, 1200);
    };

    return (
        <div className="finCommandes-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="paiement-form-title">
            <div className="finCommandes-modal__panel">

                <div className="finCommandes-modal__header">
                    <h2 className="finCommandes-modal__title" id="paiement-form-title">
                        Enregistrer un paiement
                    </h2>
                    <button
                        className="finCommandes-modal__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {success ? (
                    <div className="finCommandes-modal__body" style={{ alignItems: "center", padding: "var(--space-8)" }}>
                        <CheckCircle size={48} style={{ color: "var(--color-success)" }} aria-hidden="true" />
                        <p style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-md)", color: "var(--color-success)" }}>
                            Paiement enregistré avec succès !
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="finCommandes-modal__body">
                            {/* Récap commande */}
                            <div style={{ padding: "var(--space-3) var(--space-4)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-lg)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                                <strong style={{ color: "var(--color-text)" }}>{commande.nom}</strong>
                                <br />Reste à payer : <strong style={{ color: "var(--color-primary)" }}>{formatMontant(resteAPayer)}</strong>
                            </div>

                            {error && (
                                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", background: "rgba(231,76,60,0.07)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(231,76,60,0.2)" }}>
                                    {error}
                                </p>
                            )}

                            <div className="finCommandes-form__field">
                                <label className="finCommandes-form__label" htmlFor="montant-paiement">
                                    Montant (FCFA) <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <input
                                    id="montant-paiement"
                                    type="number"
                                    className="app-input"
                                    value={montant}
                                    onChange={e => setMontant(e.target.value)}
                                    min="1"
                                    step="100"
                                    required
                                />
                            </div>

                            <div className="finCommandes-form__field">
                                <label className="finCommandes-form__label" htmlFor="mode-paiement">
                                    Mode de paiement <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <select
                                    id="mode-paiement"
                                    className="finCommandes-form__select"
                                    value={modePaiement}
                                    onChange={e => setModePaiement(e.target.value)}
                                >
                                    {MODES.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {modePaiement !== "espèces" && (
                                <div className="finCommandes-form__field">
                                    <label className="finCommandes-form__label" htmlFor="reference-transaction">
                                        Référence de transaction <span style={{ color: "var(--color-error)" }}>*</span>
                                    </label>
                                    <input
                                        id="reference-transaction"
                                        type="text"
                                        className="app-input"
                                        value={reference}
                                        onChange={e => setReference(e.target.value)}
                                        placeholder="Ex : VIR-12345, CB-99001…"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className="finCommandes-modal__footer">
                            <button
                                className="app-button app-button--ghost"
                                onClick={onClose}
                                type="button"
                                disabled={submitting}
                            >
                                Annuler
                            </button>
                            <button
                                className="app-button app-button--primary"
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting ? "Enregistrement…" : "Confirmer le paiement"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default EnregistrerPaiementForm;
