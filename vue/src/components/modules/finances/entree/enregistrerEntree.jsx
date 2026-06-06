import { useState } from "react";
import { CheckCircle } from "lucide-react";

const ORIGINES = [
    "Vente de produits ou services",
    "Remboursement reçu",
    "Subvention ou aide publique",
    "Apport de capital",
    "Prêt bancaire reçu",
    "Dividendes ou intérêts",
    "Autre entrée",
];

function EnregistrerEntree() {
    const [date, setDate]             = useState("");
    const [montant, setMontant]       = useState("");
    const [origine, setOrigine]       = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess]       = useState(false);
    const [error, setError]           = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!date) { setError("Veuillez sélectionner une date."); return; }
        if (!montant || parseFloat(montant) <= 0) { setError("Veuillez saisir un montant valide."); return; }
        if (!origine) { setError("Veuillez choisir l'origine de l'entrée."); return; }
        if (!description.trim()) { setError("La description est obligatoire."); return; }

        setSubmitting(true);
        await new Promise(r => setTimeout(r, 800));
        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setDate("");
            setMontant("");
            setOrigine("");
            setDescription("");
        }, 2000);
    };

    if (success) {
        return (
            <div className="finEnt-empty" style={{ padding: "var(--space-16)" }}>
                <CheckCircle size={48} style={{ color: "var(--color-success)" }} aria-hidden="true" />
                <p className="finEnt-empty__title" style={{ color: "var(--color-success)" }}>
                    Entrée financière enregistrée avec succès !
                </p>
            </div>
        );
    }

    return (
        <section aria-label="Formulaire d'enregistrement d'une entrée financière">
            <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

                {error && (
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", background: "rgba(231,76,60,0.07)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(231,76,60,0.2)", margin: 0 }}>
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                    <div className="finEnt-form__field">
                        <label className="finEnt-form__label" htmlFor="ent-date">
                            Date de l'entrée <span style={{ color: "var(--color-error)" }}>*</span>
                        </label>
                        <input
                            id="ent-date"
                            type="date"
                            className="app-input"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="finEnt-form__field">
                        <label className="finEnt-form__label" htmlFor="ent-montant">
                            Montant (FCFA) <span style={{ color: "var(--color-error)" }}>*</span>
                        </label>
                        <input
                            id="ent-montant"
                            type="number"
                            className="app-input"
                            value={montant}
                            onChange={e => setMontant(e.target.value)}
                            min="1"
                            step="100"
                            required
                        />
                    </div>

                    <div className="finEnt-form__field">
                        <label className="finEnt-form__label" htmlFor="ent-origine">
                            Origine de l'entrée <span style={{ color: "var(--color-error)" }}>*</span>
                        </label>
                        <select
                            id="ent-origine"
                            className="finEnt-form__select"
                            value={origine}
                            onChange={e => setOrigine(e.target.value)}
                            required
                        >
                            <option value="">Sélectionner une origine…</option>
                            {ORIGINES.map(o => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    </div>

                    <div className="finEnt-form__field">
                        <label className="finEnt-form__label" htmlFor="ent-description">
                            Description / Détails <span style={{ color: "var(--color-error)" }}>*</span>
                        </label>
                        <textarea
                            id="ent-description"
                            className="finEnt-form__textarea"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ex : Apport externe de capital, subvention d'exploitation…"
                            required
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                            type="submit"
                            className="app-button app-button--primary"
                            disabled={submitting}
                        >
                            {submitting ? "Enregistrement…" : "Confirmer l'enregistrement"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default EnregistrerEntree;
