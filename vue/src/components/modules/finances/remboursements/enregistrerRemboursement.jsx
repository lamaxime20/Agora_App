import { useState } from "react";
import { Search, CheckCircle, X, AlertTriangle } from "lucide-react";
import ChoixCommandePane from "./choixCommandePane.jsx";
import { creerRemboursement } from "../../../../services/financesP3.js";

const SUGGESTIONS_CAUSE = [
    "Rupture de stock",
    "Geste commercial",
    "Erreur de facturation",
    "Annulation commande",
    "Défaut produit",
];

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
    new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));

function EnregistrerRemboursement() {
    const [selectedCommande, setSelectedCommande] = useState(null);
    const [montant, setMontant]                   = useState("");
    const [cause, setCause]                       = useState("");
    const [showChoixPane, setShowChoixPane]       = useState(false);
    const [showModal, setShowModal]               = useState(false);
    const [submitting, setSubmitting]             = useState(false);
    const [toast, setToast]                       = useState(null);
    const [error, setError]                       = useState("");

    const montantNum      = parseFloat(montant) || 0;
    const maxRemboursable = selectedCommande ? (selectedCommande.montant_remboursable ?? selectedCommande.total_paye) : 0;
    const depasseMax      = montantNum > 0 && montantNum > maxRemboursable;

    const showToastMsg = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const handleSelect = (cmd) => {
        console.log("commande :", cmd);
        setSelectedCommande(cmd);
        setShowChoixPane(false);
        setMontant("");
        setError("");
    };

    const validate = () => {
        if (!selectedCommande) return "Veuillez sélectionner une commande.";
        if (!montant || montantNum <= 0) return "Veuillez saisir un montant valide.";
        if (depasseMax) return `Le montant dépasse le maximum remboursable (${fmt(maxRemboursable)}).`;
        if (!cause.trim()) return "La cause du remboursement est obligatoire.";
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
            await creerRemboursement({ commandeId: selectedCommande.id, montant: montantNum, cause });
            showToastMsg("success", "Remboursement enregistré avec succès");
            setSelectedCommande(null);
            setMontant("");
            setCause("");
        } catch {
            showToastMsg("error", "Une erreur est survenue, veuillez réessayer.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <section className="finRemb-form-section" aria-label="Formulaire d'enregistrement de remboursement">
                <div className="finRemb-form__card">

                    {error && (
                        <div className="finRemb-form__error" role="alert">
                            <AlertTriangle size={14} aria-hidden="true" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="finRemb-form__fields" noValidate>

                        {/* Commande concernée */}
                        <div className="finRemb-form__field">
                            <label className="finRemb-form__label">
                                Commande concernée <span style={{ color: "var(--color-error)" }} aria-hidden="true">*</span>
                            </label>
                            <div className="finRemb-form__input-row">
                                <input
                                    type="text"
                                    className="app-input"
                                    readOnly
                                    placeholder="Cliquer pour sélectionner une commande…"
                                    value={selectedCommande ? `${selectedCommande.numero} — ${selectedCommande.client}` : ""}
                                    onClick={() => setShowChoixPane(true)}
                                    aria-label="Commande sélectionnée"
                                    style={{ cursor: "pointer", flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="app-button app-button--ghost app-button--sm"
                                    onClick={() => setShowChoixPane(true)}
                                    aria-label="Sélectionner une commande"
                                >
                                    <Search size={16} aria-hidden="true" />
                                    Choisir
                                </button>
                            </div>
                            {selectedCommande && (
                                <p className="finRemb-form__hint">
                                    Maximum remboursable :{" "}
                                    <strong style={{ color: "var(--color-success)" }}>
                                        {fmt(maxRemboursable)}
                                    </strong>
                                    {" · "}
                                    {(() => {
                                        const estPayee = selectedCommande.total_paye >= selectedCommande.montant_commande;
                                        const statut = estPayee ? "Payée" : "Partiellement payée";
                                        return (<span style={{ color: "var(--color-text-muted)" }}>{statut}</span>);
                                    })()}
                                </p>
                            )}
                        </div>

                        {/* Montant */}
                        <div className="finRemb-form__field">
                            <label className="finRemb-form__label" htmlFor="remb-montant">
                                Montant du remboursement (FCFA) <span style={{ color: "var(--color-error)" }} aria-hidden="true">*</span>
                            </label>
                            <input
                                id="remb-montant"
                                type="number"
                                className="app-input"
                                value={montant}
                                onChange={e => { setMontant(e.target.value); setError(""); }}
                                min="1"
                                step="100"
                                placeholder="0"
                                aria-describedby="remb-montant-hint"
                            />
                            {selectedCommande && montantNum > 0 && (
                                <p
                                    id="remb-montant-hint"
                                    className={`finRemb-form__hint${depasseMax ? " finRemb-form__hint--error" : ""}`}
                                >
                                    {depasseMax
                                        ? `Dépasse le maximum autorisé de ${fmt(maxRemboursable)}`
                                        : `Reste après remboursement : ${fmt(maxRemboursable - montantNum)}`}
                                </p>
                            )}
                        </div>

                        {/* Cause */}
                        <div className="finRemb-form__field">
                            <label className="finRemb-form__label" htmlFor="remb-cause">
                                Cause du remboursement <span style={{ color: "var(--color-error)" }} aria-hidden="true">*</span>
                            </label>
                            <div className="finRemb-suggestions" aria-label="Suggestions de causes">
                                {SUGGESTIONS_CAUSE.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`finRemb-suggestion-chip${cause === s ? " finRemb-suggestion-chip--active" : ""}`}
                                        onClick={() => { setCause(s); setError(""); }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                id="remb-cause"
                                className="finRemb-form__textarea"
                                value={cause}
                                onChange={e => { setCause(e.target.value); setError(""); }}
                                placeholder="Ex : Rupture de stock, geste commercial, erreur de facturation…"
                            />
                        </div>

                        <div className="finRemb-form__actions">
                            <button
                                type="submit"
                                className="app-button app-button--primary"
                                disabled={submitting || depasseMax}
                            >
                                {submitting ? "Enregistrement en cours…" : "Enregistrer le remboursement"}
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Drawer sélection commande */}
            {showChoixPane && (
                <ChoixCommandePane
                    onSelectCommande={handleSelect}
                    onClose={() => setShowChoixPane(false)}
                />
            )}

            {/* Modal de confirmation */}
            {showModal && selectedCommande && (
                <div
                    className="finRemb-modal__overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="remb-confirm-title"
                >
                    <div className="finRemb-modal__panel">
                        <div className="finRemb-modal__header">
                            <h2 className="finRemb-modal__title" id="remb-confirm-title">
                                Confirmer le remboursement
                            </h2>
                            <button
                                className="finRemb-modal__close"
                                onClick={() => setShowModal(false)}
                                type="button"
                                aria-label="Annuler"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="finRemb-modal__body">
                            <div className="finRemb-confirm__summary">
                                <div className="finRemb-detail__row">
                                    <span className="finRemb-detail__key">Commande</span>
                                    <span className="finRemb-detail__val">
                                        {selectedCommande.numero} — {selectedCommande.client}
                                    </span>
                                </div>
                                <div className="finRemb-detail__row">
                                    <span className="finRemb-detail__key">Montant remboursé</span>
                                    <span
                                        className="finRemb-detail__val finRemb-detail__val--amount"
                                        style={{ color: "var(--color-error)" }}
                                    >
                                        {fmt(montantNum)}
                                    </span>
                                </div>
                                <div className="finRemb-detail__row">
                                    <span className="finRemb-detail__key">Cause</span>
                                    <span className="finRemb-detail__val" style={{ textAlign: "right", maxWidth: "240px" }}>
                                        {cause}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="finRemb-modal__footer">
                            <button
                                className="app-button app-button--ghost"
                                onClick={() => setShowModal(false)}
                                type="button"
                            >
                                Annuler
                            </button>
                            <button
                                className="app-button app-button--primary"
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
                    className={`finRemb-toast finRemb-toast--${toast.type}`}
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

export default EnregistrerRemboursement;
