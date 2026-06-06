import { useState } from "react";
import { CheckCircle } from "lucide-react";

const CATEGORIES = [
    "Fournitures de bureau",
    "Loyer et charges",
    "Électricité / eau",
    "Maintenance et réparation",
    "Transport et carburant",
    "Salaires et charges sociales",
    "Communication et internet",
    "Marketing et publicité",
    "Sous-traitance",
    "Autre",
];

function EnregistrerDepense() {
    const [date, setDate]             = useState("");
    const [montant, setMontant]       = useState("");
    const [categorie, setCategorie]   = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess]       = useState(false);
    const [error, setError]           = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!date) { setError("Veuillez sélectionner une date."); return; }
        if (!montant || parseFloat(montant) <= 0) { setError("Veuillez saisir un montant valide."); return; }
        if (!categorie) { setError("Veuillez choisir une catégorie."); return; }
        if (!description.trim()) { setError("La description est obligatoire."); return; }

        setSubmitting(true);
        await new Promise(r => setTimeout(r, 800));
        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setDate("");
            setMontant("");
            setCategorie("");
            setDescription("");
        }, 2000);
    };

    if (success) {
        return (
            <div className="finDep-empty" style={{ padding: "var(--space-16)" }}>
                <CheckCircle size={48} style={{ color: "var(--color-success)" }} aria-hidden="true" />
                <p className="finDep-empty__title" style={{ color: "var(--color-success)" }}>
                    Dépense enregistrée avec succès !
                </p>
            </div>
        );
    }

    return (
        <section aria-label="Formulaire d'enregistrement d'une dépense">
            <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

                {error && (
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", background: "rgba(231,76,60,0.07)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(231,76,60,0.2)", margin: 0 }}>
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                    <div className="finDep-form__field">
                        <label className="finDep-form__label" htmlFor="dep-date">
                            Date de la dépense <span style={{ color: "var(--color-error)" }}>*</span>
                        </label>
                        <input
                            id="dep-date"
                            type="date"
                            className="app-input"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="finDep-form__field">
                        <label className="finDep-form__label" htmlFor="dep-montant">
                            Montant (FCFA) <span style={{ color: "var(--color-error)" }}>*</span>
                        </label>
                        <input
                            id="dep-montant"
                            type="number"
                            className="app-input"
                            value={montant}
                            onChange={e => setMontant(e.target.value)}
                            min="1"
                            step="100"
                            required
                        />
                    </div>

                    <div className="finDep-form__field">
                        <label className="finDep-form__label" htmlFor="dep-categorie">
                            Catégorie <span style={{ color: "var(--color-error)" }}>*</span>
                        </label>
                        <select
                            id="dep-categorie"
                            className="finDep-form__select"
                            value={categorie}
                            onChange={e => setCategorie(e.target.value)}
                            required
                        >
                            <option value="">Sélectionner une catégorie…</option>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="finDep-form__field">
                        <label className="finDep-form__label" htmlFor="dep-description">
                            Description / Justification <span style={{ color: "var(--color-error)" }}>*</span>
                        </label>
                        <textarea
                            id="dep-description"
                            className="finDep-form__textarea"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ex : Achat de rames de papier A4, paiement facture électricité…"
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

export default EnregistrerDepense;
