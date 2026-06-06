import { useState } from "react";
import { Search, CheckCircle } from "lucide-react";
import ChoixCommandePane from "./ChoixCommandePane.jsx";

function EnregistrerRemboursement() {
    const [selectedCommande, setSelectedCommande] = useState(null);
    const [montant, setMontant]                   = useState("");
    const [cause, setCause]                       = useState("");
    const [showChoixPane, setShowChoixPane]       = useState(false);
    const [submitting, setSubmitting]             = useState(false);
    const [success, setSuccess]                   = useState(false);
    const [error, setError]                       = useState("");

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const handleSelect = (commande) => {
        setSelectedCommande(commande);
        setShowChoixPane(false);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!selectedCommande) {
            setError("Veuillez sélectionner une commande.");
            return;
        }
        if (!montant || parseFloat(montant) <= 0) {
            setError("Veuillez saisir un montant valide.");
            return;
        }
        if (parseFloat(montant) > selectedCommande.totalPaye) {
            setError(`Le montant ne peut pas dépasser le total payé (${formatMontant(selectedCommande.totalPaye)}).`);
            return;
        }
        if (!cause.trim()) {
            setError("La cause du remboursement est obligatoire.");
            return;
        }

        setSubmitting(true);
        await new Promise(r => setTimeout(r, 900));
        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setSelectedCommande(null);
            setMontant("");
            setCause("");
        }, 2000);
    };

    if (success) {
        return (
            <div className="finRemb-empty" style={{ padding: "var(--space-16)" }}>
                <CheckCircle size={48} style={{ color: "var(--color-success)" }} aria-hidden="true" />
                <p className="finRemb-empty__title" style={{ color: "var(--color-success)" }}>
                    Remboursement enregistré avec succès !
                </p>
            </div>
        );
    }

    return (
        <>
            <section aria-label="Formulaire d'enregistrement de remboursement">
                <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

                    {error && (
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", background: "rgba(231,76,60,0.07)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(231,76,60,0.2)", margin: 0 }}>
                            {error}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                        {/* Sélection commande */}
                        <div className="finRemb-form__field">
                            <label className="finRemb-form__label">
                                Commande concernée <span style={{ color: "var(--color-error)" }}>*</span>
                            </label>
                            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                                <input
                                    type="text"
                                    className="app-input"
                                    readOnly
                                    placeholder="Cliquer pour sélectionner une commande…"
                                    value={selectedCommande ? `${selectedCommande.id} — ${selectedCommande.nom}` : ""}
                                    style={{ flex: 1, cursor: "pointer" }}
                                    onClick={() => setShowChoixPane(true)}
                                    aria-label="Commande sélectionnée"
                                />
                                <button
                                    type="button"
                                    className="app-button app-button--ghost app-button--sm"
                                    onClick={() => setShowChoixPane(true)}
                                    aria-label="Sélectionner une commande"
                                    style={{ flexShrink: 0 }}
                                >
                                    <Search size={16} aria-hidden="true" />
                                    Choisir
                                </button>
                            </div>
                            {selectedCommande && (
                                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "var(--space-1) 0 0" }}>
                                    Total payé par le client : <strong style={{ color: "var(--color-success)" }}>{formatMontant(selectedCommande.totalPaye)}</strong>
                                    &nbsp;·&nbsp;{selectedCommande.statutLivraison}
                                </p>
                            )}
                        </div>

                        {/* Montant */}
                        <div className="finRemb-form__field">
                            <label className="finRemb-form__label" htmlFor="remb-montant">
                                Montant du remboursement (FCFA) <span style={{ color: "var(--color-error)" }}>*</span>
                            </label>
                            <input
                                id="remb-montant"
                                type="number"
                                className="app-input"
                                value={montant}
                                onChange={e => setMontant(e.target.value)}
                                min="1"
                                step="100"
                                required
                            />
                        </div>

                        {/* Cause */}
                        <div className="finRemb-form__field">
                            <label className="finRemb-form__label" htmlFor="remb-cause">
                                Cause du remboursement <span style={{ color: "var(--color-error)" }}>*</span>
                            </label>
                            <textarea
                                id="remb-cause"
                                className="finRemb-form__textarea"
                                value={cause}
                                onChange={e => setCause(e.target.value)}
                                placeholder="Ex : Rupture de stock, geste commercial, erreur de facturation…"
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

            {showChoixPane && (
                <ChoixCommandePane
                    onSelectCommande={handleSelect}
                    onClose={() => setShowChoixPane(false)}
                />
            )}
        </>
    );
}

export default EnregistrerRemboursement;
