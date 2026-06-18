import { useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { creerPaiement } from "../../../../services/financesDashboard.js";
import "../../../../assets/styles/components/modules/finances/enregistrerPaiementForm.css";

const MODES = ["virement bancaire", "carte bancaire", "chèque", "espèces"];

/* ── Étape 1 : saisie du formulaire ── */
function EtapeFormulaire({ commande, onSubmit, onClose, apiError }) {
    const [montant,      setMontant]      = useState("");
    const [mode,         setMode]         = useState("virement bancaire");
    const [reference,    setReference]    = useState("");
    const [erreur,       setErreur]       = useState(apiError ?? "");

    const fmt = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const resteAPayer = commande.total - commande.paye;
    const montantNum  = parseFloat(montant);

    const valider = (e) => {
        e.preventDefault();
        setErreur("");

        if (!montant || isNaN(montantNum) || montantNum <= 0) {
            setErreur("Veuillez saisir un montant valide.");
            return;
        }
        if (montantNum > resteAPayer) {
            setErreur(`Le montant ne peut pas dépasser le reste à payer (${fmt(resteAPayer)}).`);
            return;
        }
        if (mode !== "espèces" && !reference.trim()) {
            setErreur("La référence de transaction est obligatoire pour ce mode de paiement.");
            return;
        }

        onSubmit({ montant: montantNum, mode, reference: reference.trim() });
    };

    return (
        <form onSubmit={valider}>
            <div className="finCommandes-modal__body">

                {/* Récap commande */}
                <div className="finCommandes-paiement-recap">
                    <p className="finCommandes-paiement-recap__nom">{commande.nom}</p>
                    <div className="finCommandes-paiement-recap__montants">
                        <span className="finCommandes-paiement-recap__item">
                            Total : <strong>{fmt(commande.total)}</strong>
                        </span>
                        <span className="finCommandes-paiement-recap__sep" />
                        <span className="finCommandes-paiement-recap__item">
                            Déjà payé : <strong>{fmt(commande.paye)}</strong>
                        </span>
                        <span className="finCommandes-paiement-recap__sep" />
                        <span className="finCommandes-paiement-recap__item finCommandes-paiement-recap__item--reste">
                            Reste : <strong>{fmt(resteAPayer)}</strong>
                        </span>
                    </div>
                </div>

                {/* Erreur */}
                {erreur && (
                    <div className="finCommandes-paiement-erreur">
                        <AlertTriangle size={15} aria-hidden="true" />
                        {erreur}
                    </div>
                )}

                {/* Montant */}
                <div className="finCommandes-form__field">
                    <label className="finCommandes-form__label" htmlFor="montant-paiement">
                        Montant du paiement (FCFA) <span aria-hidden="true" style={{ color: "var(--color-error)" }}>*</span>
                    </label>
                    <input
                        id="montant-paiement"
                        type="number"
                        className="app-input"
                        value={montant}
                        onChange={e => setMontant(e.target.value)}
                        min="1"
                        max={resteAPayer}
                        step="1"
                        placeholder={`Jusqu'à ${fmt(resteAPayer)}`}
                        required
                        autoFocus
                    />
                </div>

                {/* Mode de paiement */}
                <div className="finCommandes-form__field">
                    <label className="finCommandes-form__label" htmlFor="mode-paiement">
                        Mode de paiement <span aria-hidden="true" style={{ color: "var(--color-error)" }}>*</span>
                    </label>
                    <select
                        id="mode-paiement"
                        className="finCommandes-form__select"
                        value={mode}
                        onChange={e => { setMode(e.target.value); setReference(""); }}
                    >
                        {MODES.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* Référence (masquée si espèces) */}
                {mode !== "espèces" && (
                    <div className="finCommandes-form__field">
                        <label className="finCommandes-form__label" htmlFor="reference-transaction">
                            Référence de transaction <span aria-hidden="true" style={{ color: "var(--color-error)" }}>*</span>
                        </label>
                        <input
                            id="reference-transaction"
                            type="text"
                            className="app-input"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            placeholder="Ex : VIR-12345, CB-99001, CHQ-0042…"
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
                >
                    Annuler
                </button>
                <button
                    className="app-button app-button--primary"
                    type="submit"
                >
                    Continuer
                </button>
            </div>
        </form>
    );
}

/* ── Étape 2 : confirmation ── */
function EtapeConfirmation({ commande, paiement, onConfirm, onRetour, submitting }) {
    const fmt = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    return (
        <>
            <div className="finCommandes-modal__body">
                <div className="finCommandes-confirmation-bloc">
                    <div className="finCommandes-confirmation-bloc__icon">
                        <AlertTriangle size={24} aria-hidden="true" />
                    </div>
                    <p className="finCommandes-confirmation-bloc__titre">Vérifiez avant de confirmer</p>
                    <p className="finCommandes-confirmation-bloc__desc">
                        Une fois enregistré, ce paiement ne pourra pas être modifié.
                    </p>
                </div>

                <div className="finCommandes-confirmation-details">
                    <div className="finCommandes-detail__row">
                        <span className="finCommandes-detail__key">Commande</span>
                        <span className="finCommandes-detail__val">{commande.nom}</span>
                    </div>
                    <div className="finCommandes-detail__row">
                        <span className="finCommandes-detail__key">Montant enregistré</span>
                        <span className="finCommandes-detail__val finCommandes-detail__val--amount" style={{ color: "var(--color-success)", fontSize: "var(--text-md)" }}>
                            {fmt(paiement.montant)}
                        </span>
                    </div>
                    <div className="finCommandes-detail__row">
                        <span className="finCommandes-detail__key">Mode de paiement</span>
                        <span className="finCommandes-detail__val">
                            <span className="fin-badge fin-badge--info">{paiement.mode}</span>
                        </span>
                    </div>
                    {paiement.reference && (
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Référence</span>
                            <span className="finCommandes-detail__val">{paiement.reference}</span>
                        </div>
                    )}
                    {!paiement.reference && (
                        <div className="finCommandes-detail__row">
                            <span className="finCommandes-detail__key">Référence</span>
                            <span className="finCommandes-detail__val" style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>Paiement en espèces</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="finCommandes-modal__footer">
                <button
                    className="app-button app-button--ghost"
                    onClick={onRetour}
                    type="button"
                    disabled={submitting}
                >
                    <ArrowLeft size={15} aria-hidden="true" />
                    Modifier
                </button>
                <button
                    className="app-button app-button--primary"
                    onClick={onConfirm}
                    type="button"
                    disabled={submitting}
                >
                    {submitting ? "Enregistrement…" : "Confirmer le paiement"}
                </button>
            </div>
        </>
    );
}

/* ── Étape 3 : succès ── */
function EtapeSucces({ onClose }) {
    return (
        <div className="finCommandes-modal__body" style={{ alignItems: "center", justifyContent: "center", padding: "var(--space-10) var(--space-6)", gap: "var(--space-4)" }}>
            <CheckCircle size={52} style={{ color: "var(--color-success)" }} aria-hidden="true" />
            <p style={{ fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", fontSize: "var(--text-lg)", color: "var(--color-success)", textAlign: "center" }}>
                Paiement enregistré avec succès
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "260px", lineHeight: "var(--line-height-relaxed)" }}>
                L'argent virtuel a été mis à jour et le statut de la commande recalculé.
            </p>
            <button
                className="app-button app-button--ghost"
                onClick={onClose}
                type="button"
                style={{ marginTop: "var(--space-2)" }}
            >
                Fermer
            </button>
        </div>
    );
}

/* ── Composant principal ── */
function EnregistrerPaiementForm({ commande, onClose }) {
    const [etape,     setEtape]     = useState("form");
    const [apiError,  setApiError]  = useState(null);
    const [paiement,  setPaiement]  = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleFormSubmit = (data) => {
        setApiError(null);
        setPaiement(data);
        setEtape("confirm");
    };

    const handleConfirm = async () => {
        setSubmitting(true);
        setApiError(null);
        try {
            await creerPaiement({
                commande_id: commande.id,
                ...paiement,
            }, commande.id);
            setEtape("success");
        } catch (err) {
            setApiError(err.message || "Une erreur inattendue est survenue.");
            setEtape("form");
        } finally {
            setSubmitting(false);
        }
    };

    const titres = {
        form:    "Enregistrer un paiement",
        confirm: "Confirmer le paiement",
        success: null,
    };

    return createPortal(
        <div
            className="finCommandes-modal__overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paiement-form-title"
        >
            <div className="finCommandes-modal__panel">

                {etape !== "success" && (
                    <div className="finCommandes-modal__header">
                        <h2 className="finCommandes-modal__title" id="paiement-form-title">
                            {titres[etape]}
                        </h2>
                        <button
                            className="finCommandes-modal__close"
                            onClick={onClose}
                            aria-label="Fermer"
                            type="button"
                            disabled={submitting}
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>
                )}

                {etape === "form" && (
                    <EtapeFormulaire
                        commande={commande}
                        onSubmit={handleFormSubmit}
                        apiError={apiError}
                        onClose={onClose}
                    />
                )}

                {etape === "confirm" && paiement && (
                    <EtapeConfirmation
                        commande={commande}
                        paiement={paiement}
                        onConfirm={handleConfirm}
                        onRetour={() => setEtape("form")}
                        submitting={submitting}
                    />
                )}

                {etape === "success" && (
                    <EtapeSucces onClose={onClose} />
                )}

            </div>
        </div>,
        document.body
    );
}

export default EnregistrerPaiementForm;
