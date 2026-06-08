import { useState } from "react";
import { X, CheckCircle, Loader, AlertTriangle, RotateCcw } from "lucide-react";
import {
    lancerLivraison,
    validerLivraison,
    echecLivraison,
    retourLivraison,
    annulerLivraison,
} from "../../../services/livraison.js";
import "../../../assets/styles/components/modules/livraison/DeliveryDialog.css";

// ─── Dialog générique avec motif ─────────────────────────────────────────────

function MotifDialog({ title, placeholder, confirmLabel, confirmVariant, onConfirm, onClose, minLength = 20 }) {
    const [motif, setMotif]         = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]         = useState("");
    const valid = motif.trim().length >= minLength;

    const handleSubmit = async () => {
        if (!valid) return;
        setSubmitting(true);
        setError("");
        try {
            await onConfirm(motif.trim());
            onClose();
        } catch {
            setError("Une erreur est survenue. Veuillez réessayer.");
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="deliveryDialog-backdrop" onClick={onClose} aria-hidden="true" />
            <div className="deliveryDialog-sheet" role="dialog" aria-modal="true" aria-label={title}>
                <div className="deliveryDialog-header">
                    <h2 className="deliveryDialog-title">{title}</h2>
                    <button type="button" className="deliveryDialog-close" onClick={onClose} aria-label="Fermer">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <div className="deliveryDialog-body">
                    <textarea
                        className="deliveryDialog-textarea"
                        placeholder={placeholder}
                        value={motif}
                        onChange={e => setMotif(e.target.value)}
                        rows={4}
                        aria-label={placeholder}
                    />
                    <p className="deliveryDialog-hint">
                        {motif.trim().length}/{minLength} caractères minimum
                    </p>
                    {error && <p className="deliveryDialog-error">{error}</p>}
                </div>
                <div className="deliveryDialog-footer">
                    <button type="button" className="deliveryDialog-btn deliveryDialog-btn--ghost" onClick={onClose}>
                        Retour
                    </button>
                    <button
                        type="button"
                        className={`deliveryDialog-btn deliveryDialog-btn--${confirmVariant}`}
                        onClick={handleSubmit}
                        disabled={!valid || submitting}
                    >
                        {submitting
                            ? <><Loader size={16} className="deliveryDialog-loading__spin" aria-hidden="true" /> En cours…</>
                            : confirmLabel}
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── Dialog confirmation simple (Lancer / Valider) ────────────────────────────

function ConfirmDialog({ title, icon: Icon, iconVariant, message, confirmLabel, confirmVariant, onConfirm, onClose }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]         = useState("");

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            await onConfirm();
            onClose();
        } catch {
            setError("Une erreur est survenue. Veuillez réessayer.");
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="deliveryDialog-backdrop" onClick={onClose} aria-hidden="true" />
            <div className="deliveryDialog-sheet deliveryDialog-sheet--sm" role="dialog" aria-modal="true" aria-label={title}>
                <div className="deliveryDialog-header">
                    <h2 className="deliveryDialog-title">{title}</h2>
                    <button type="button" className="deliveryDialog-close" onClick={onClose} aria-label="Fermer">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <div className="deliveryDialog-body deliveryDialog-body--centered">
                    <div className={`deliveryDialog-icon deliveryDialog-icon--${iconVariant}`}>
                        <Icon size={32} aria-hidden="true" />
                    </div>
                    <p className="deliveryDialog-message">{message}</p>
                    {error && <p className="deliveryDialog-error">{error}</p>}
                </div>
                <div className="deliveryDialog-footer">
                    <button type="button" className="deliveryDialog-btn deliveryDialog-btn--ghost" onClick={onClose}>
                        Annuler
                    </button>
                    <button
                        type="button"
                        className={`deliveryDialog-btn deliveryDialog-btn--${confirmVariant}`}
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting
                            ? <><Loader size={16} className="deliveryDialog-loading__spin" aria-hidden="true" /> En cours…</>
                            : confirmLabel}
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── Exports spécialisés ──────────────────────────────────────────────────────

export function LaunchDeliveryDialog({ livraison, onClose, onSuccess }) {
    return (
        <ConfirmDialog
            title="Lancer la livraison"
            icon={Loader}
            iconVariant="primary"
            message={`Confirmer le démarrage de la livraison pour la commande ${livraison?.commande} ?`}
            confirmLabel="Lancer"
            confirmVariant="primary"
            onConfirm={async () => { await lancerLivraison(livraison.id); onSuccess?.(); }}
            onClose={onClose}
        />
    );
}

export function ValidateDeliveryDialog({ livraison, onClose, onSuccess }) {
    return (
        <ConfirmDialog
            title="Confirmer la livraison"
            icon={CheckCircle}
            iconVariant="success"
            message={`Confirmez-vous que le client a bien reçu sa commande ${livraison?.commande} ?`}
            confirmLabel="Confirmer"
            confirmVariant="success"
            onConfirm={async () => { await validerLivraison(livraison.id); onSuccess?.(); }}
            onClose={onClose}
        />
    );
}

export function CancelDeliveryDialog({ livraison, onClose, onSuccess }) {
    return (
        <MotifDialog
            title="Annuler la livraison"
            placeholder="Raison de l'annulation…"
            confirmLabel="Confirmer l'annulation"
            confirmVariant="danger"
            onConfirm={async (motif) => { await annulerLivraison(livraison.id, motif); onSuccess?.(); }}
            onClose={onClose}
        />
    );
}

export function EchecDeliveryDialog({ livraison, onClose, onSuccess }) {
    return (
        <MotifDialog
            title="Déclarer un échec"
            placeholder="Motif de l'échec de livraison…"
            confirmLabel="Déclarer l'échec"
            confirmVariant="danger"
            onConfirm={async (motif) => { await echecLivraison(livraison.id, motif); onSuccess?.(); }}
            onClose={onClose}
        />
    );
}

export function RetourDeliveryDialog({ livraison, onClose, onSuccess }) {
    return (
        <MotifDialog
            title="Retour de livraison"
            placeholder="Motif du retour…"
            confirmLabel="Confirmer le retour"
            confirmVariant="warning"
            icon={RotateCcw}
            onConfirm={async (motif) => { await retourLivraison(livraison.id, motif); onSuccess?.(); }}
            onClose={onClose}
        />
    );
}
