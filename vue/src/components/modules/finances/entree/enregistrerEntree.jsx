import { useState } from "react";
import { CheckCircle, X, AlertTriangle } from "lucide-react";
import { creerEntree } from "../../../../services/financesP3.js";

const SUGGESTIONS = [
    "Investissement",
    "Apport associé",
    "Prime exceptionnelle",
    "Subvention",
    "Autre",
];

const fmtMontant = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
    new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));

function EnregistrerEntree() {
    const [date, setDate]             = useState("");
    const [montant, setMontant]       = useState("");
    const [description, setDescription] = useState("");
    const [showModal, setShowModal]   = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast]           = useState(null);
    const [error, setError]           = useState("");

    const showToastMsg = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const validate = () => {
        if (!date) return "Veuillez sélectionner une date.";
        if (!montant || parseFloat(montant) <= 0) return "Veuillez saisir un montant valide.";
        if (!description.trim()) return "La description est obligatoire.";
        return "";
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError("");
        setShowModal(true);
    };

    const handleConfirm = async () => {
        setShowModal(false);
        setSubmitting(true);
        try {
            await creerEntree({ date, montant: parseFloat(montant), description });
            showToastMsg("success", "Entrée financière enregistrée avec succès");
            setDate("");
            setMontant("");
            setDescription("");
        } catch {
            showToastMsg("error", "Une erreur est survenue, veuillez réessayer.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <section className="finEnt-form-section" aria-label="Formulaire d'enregistrement d'une entrée financière">
                <div className="finEnt-form__card">

                    {error && (
                        <div className="finEnt-form__error" role="alert">
                            <AlertTriangle size={14} aria-hidden="true" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="finEnt-form__fields" noValidate>

                        <div className="finEnt-form__field">
                            <label className="finEnt-form__label" htmlFor="ent-date">
                                Date de l'entrée <span style={{ color: "var(--color-error)" }} aria-hidden="true">*</span>
                            </label>
                            <input
                                id="ent-date"
                                type="date"
                                className="app-input"
                                value={date}
                                onChange={e => { setDate(e.target.value); setError(""); }}
                            />
                        </div>

                        <div className="finEnt-form__field">
                            <label className="finEnt-form__label" htmlFor="ent-montant">
                                Montant (FCFA) <span style={{ color: "var(--color-error)" }} aria-hidden="true">*</span>
                            </label>
                            <input
                                id="ent-montant"
                                type="number"
                                className="app-input"
                                value={montant}
                                onChange={e => { setMontant(e.target.value); setError(""); }}
                                min="1"
                                step="100"
                                placeholder="0"
                            />
                        </div>

                        <div className="finEnt-form__field">
                            <label className="finEnt-form__label" htmlFor="ent-description">
                                Description <span style={{ color: "var(--color-error)" }} aria-hidden="true">*</span>
                            </label>
                            <div className="finEnt-suggestions" aria-label="Suggestions rapides">
                                {SUGGESTIONS.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`finEnt-suggestion-chip${description === s ? " finEnt-suggestion-chip--active" : ""}`}
                                        onClick={() => { setDescription(s); setError(""); }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                id="ent-description"
                                className="finEnt-form__textarea"
                                value={description}
                                onChange={e => { setDescription(e.target.value); setError(""); }}
                                placeholder="Ex : Apport de capital, subvention d'exploitation, investissement…"
                            />
                        </div>

                        <div className="finEnt-form__actions">
                            <button
                                type="submit"
                                className="finEnt-submit-btn"
                                disabled={submitting}
                            >
                                {submitting ? "Enregistrement en cours…" : "Enregistrer l'entrée"}
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Modal de confirmation */}
            {showModal && (
                <div
                    className="finEnt-modal__overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ent-confirm-title"
                >
                    <div className="finEnt-modal__panel">
                        <div className="finEnt-modal__header">
                            <h2 className="finEnt-modal__title" id="ent-confirm-title">Confirmer l'entrée</h2>
                            <button
                                className="finEnt-modal__close"
                                onClick={() => setShowModal(false)}
                                type="button"
                                aria-label="Annuler"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="finEnt-modal__body">
                            <div className="finEnt-confirm__summary">
                                <div className="finEnt-detail__row">
                                    <span className="finEnt-detail__key">Date</span>
                                    <span className="finEnt-detail__val">{fmtDate(date)}</span>
                                </div>
                                <div className="finEnt-detail__row">
                                    <span className="finEnt-detail__key">Montant</span>
                                    <span
                                        className="finEnt-detail__val finEnt-detail__val--amount"
                                        style={{ color: "var(--color-success)" }}
                                    >
                                        {fmtMontant(parseFloat(montant))}
                                    </span>
                                </div>
                                <div className="finEnt-detail__row">
                                    <span className="finEnt-detail__key">Description</span>
                                    <span className="finEnt-detail__val" style={{ textAlign: "right", maxWidth: "240px" }}>
                                        {description}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="finEnt-modal__footer">
                            <button
                                className="app-button app-button--ghost"
                                onClick={() => setShowModal(false)}
                                type="button"
                            >
                                Annuler
                            </button>
                            <button
                                className="finEnt-submit-btn"
                                onClick={handleConfirm}
                                type="button"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className={`finEnt-toast finEnt-toast--${toast.type}`}
                    role="status"
                    aria-live="polite"
                >
                    {toast.type === "success"
                        ? <CheckCircle size={16} aria-hidden="true" />
                        : <AlertTriangle size={16} aria-hidden="true" />}
                    {toast.msg}
                </div>
            )}
        </>
    );
}

export default EnregistrerEntree;
