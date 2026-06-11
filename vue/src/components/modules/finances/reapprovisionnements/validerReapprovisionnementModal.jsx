import { useState } from "react";
import { X, AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { validerReappro } from "../../../../services/financesP4.js";

const PRIORITY_LABEL = { faible: "Faible", normale: "Normale", haute: "Haute", critique: "Critique" };

function ValiderReapprovisionnementModal({ reappro, onClose, onSuccess }) {
    const [password, setPassword]     = useState("");
    const [showPwd, setShowPwd]       = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState("");
    const [done, setDone]             = useState(false);

    console.log("valider :", reappro);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const handleConfirm = async () => {
        if (!password.trim()) {
            setError("Le mot de passe est requis pour valider cette opération.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            await validerReappro(reappro.id, { motDePasse: password });
            setDone(true);
            setTimeout(() => { onSuccess(); onClose(); }, 1400);
        } catch {
            setError("Une erreur est survenue. Veuillez réessayer.");
            setSubmitting(false);
        }
    };

    return (
        <div className="finReapp-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="valider-reappro-title">
            <div className="finReapp-modal__panel finReapp-modal__panel--danger">
                <div className="finReapp-modal__header">
                    <h2 className="finReapp-modal__title" id="valider-reappro-title">
                        Validation du réapprovisionnement
                    </h2>
                    <button className="finReapp-modal__close" onClick={onClose} aria-label="Fermer" type="button" disabled={submitting}>
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {done ? (
                    <div className="finReapp-modal__body" style={{ alignItems: "center", padding: "var(--space-8)" }}>
                        <CheckCircle size={48} style={{ color: "var(--color-success)" }} aria-hidden="true" />
                        <p style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-success)", margin: 0 }}>
                            Réapprovisionnement validé. Paiement engagé.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="finReapp-modal__body">
                            {/* Danger banner */}
                            <div className="finReapp-danger-banner">
                                <AlertTriangle size={20} aria-hidden="true" />
                                <div>
                                    <p className="finReapp-danger-banner__title">Action irréversible</p>
                                    <p className="finReapp-danger-banner__desc">
                                        Cette action engage définitivement un paiement de{" "}
                                        <strong>{formatMontant(reappro.montant_a_depenser)}</strong> sur la trésorerie.
                                    </p>
                                </div>
                            </div>

                            {/* Product info */}
                            <div className="finReapp-modal__info-block">
                                <div className="finReapp-detail__row">
                                    <span className="finReapp-detail__key">Produit</span>
                                    <span className="finReapp-detail__val">
                                        {reappro.produit}
                                        {reappro.produit?.sku && <span className="finReapp-sku-badge">{reappro.produit.sku}</span>}
                                    </span>
                                </div>
                                <div className="finReapp-detail__row">
                                    <span className="finReapp-detail__key">Quantité</span>
                                    <span className="finReapp-detail__val">{reappro.quantite} unités</span>
                                </div>
                                <div className="finReapp-detail__row">
                                    <span className="finReapp-detail__key">Montant total</span>
                                    <span className="finReapp-detail__val finReapp-detail__val--amount">
                                        {formatMontant(reappro.montant_a_depenser)}
                                    </span>
                                </div>
                                {reappro.priorite && <div className="finReapp-detail__row">
                                    <span className="finReapp-detail__key">Priorité</span>
                                    <span className="finReapp-detail__val">
                                        <span className={`finReapp-priority finReapp-priority--${reappro.priorite}`}>
                                            {PRIORITY_LABEL[reappro.priorite] ?? reappro.priorite}
                                        </span>
                                    </span>
                                </div>}
                                <div className="finReapp-detail__row" style={{ borderBottom: "none" }}>
                                    <span className="finReapp-detail__key">Demandeur</span>
                                    <span className="finReapp-detail__val">{reappro.demandeur}</span>
                                </div>
                            </div>

                            {/* Password field */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                                <label
                                    htmlFor="valider-pwd"
                                    style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text)" }}
                                >
                                    Mot de passe de confirmation <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        id="valider-pwd"
                                        type={showPwd ? "text" : "password"}
                                        className="app-input"
                                        style={{ paddingRight: "40px" }}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Entrez votre mot de passe"
                                        autoComplete="current-password"
                                        onKeyDown={e => e.key === "Enter" && handleConfirm()}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(v => !v)}
                                        style={{
                                            position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                                            background: "none", border: "none", cursor: "pointer",
                                            color: "var(--color-text-muted)", display: "flex", padding: "2px"
                                        }}
                                        aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    >
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {error && (
                                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-error)", margin: 0 }}>{error}</p>
                                )}
                            </div>
                        </div>

                        <div className="finReapp-modal__footer">
                            <button className="app-button app-button--ghost" onClick={onClose} type="button" disabled={submitting}>
                                Annuler
                            </button>
                            <button
                                className="app-button"
                                style={{
                                    background: password.trim() ? "var(--color-error)" : "var(--color-border)",
                                    color: password.trim() ? "#fff" : "var(--color-text-muted)",
                                    border: "none",
                                    cursor: password.trim() ? "pointer" : "not-allowed",
                                    transition: "all 200ms ease-out"
                                }}
                                onClick={handleConfirm}
                                type="button"
                                disabled={submitting || !password.trim()}
                                aria-disabled={!password.trim()}
                            >
                                {submitting ? "Validation…" : "Valider définitivement"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ValiderReapprovisionnementModal;
