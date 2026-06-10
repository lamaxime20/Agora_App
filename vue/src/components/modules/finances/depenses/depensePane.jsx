import { X } from "lucide-react";

function DepensePane({ depense, onClose }) {
    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) => {
        const date = new Date(d);
        if (isNaN(date.getTime())) return ""; // Retourne une chaîne vide si la date est invalide
        return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
    };

    return (
        <>
            <div
                className="finDep-drawer__overlay"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finDep-drawer"
                role="complementary"
                aria-label={`Détails de la dépense ${depense.id}`}
            >
                <div className="finDep-drawer__handle">
                    <div className="finDep-drawer__handle-bar" />
                </div>

                <div className="finDep-drawer__header">
                    <h2 className="finDep-drawer__title">Dépense {depense.id}</h2>
                    <button
                        className="finDep-drawer__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finDep-drawer__body">
                    <section>
                        <p className="finDep-detail__section-label">Détails de la dépense</p>
                        <div className="finDep-detail__row">
                            <span className="finDep-detail__key">Référence</span>
                            <span className="finDep-detail__val">{depense.id}</span>
                        </div>
                        <div className="finDep-detail__row">
                            <span className="finDep-detail__key">Date</span>
                            <span className="finDep-detail__val">{formatDate(depense.date_depense)}</span>
                        </div>
                        <div className="finDep-detail__row">
                            <span className="finDep-detail__key">Enregistré par</span>
                            <span className="finDep-detail__val">{depense.enregistre_par ?? "—"}</span>
                        </div>
                        <div className="finDep-detail__row">
                            <span className="finDep-detail__key">Montant</span>
                            <span
                                className="finDep-detail__val finDep-detail__val--amount"
                                style={{ color: "var(--color-error)" }}
                            >
                                {formatMontant(depense.montant)}
                            </span>
                        </div>
                        <div
                            className="finDep-detail__row"
                            style={{ flexDirection: "column", gap: "var(--space-2)", alignItems: "flex-start" }}
                        >
                            <span className="finDep-detail__key">Raison</span>
                            <p
                                style={{
                                    fontSize: "var(--text-sm)",
                                    color: "var(--color-text)",
                                    margin: 0,
                                    lineHeight: "1.6",
                                }}
                            >
                                {depense.raison}
                            </p>
                        </div>
                    </section>
                </div>

                <div className="finDep-drawer__footer">
                    <button
                        className="app-button app-button--ghost"
                        style={{ width: "100%" }}
                        onClick={onClose}
                        type="button"
                    >
                        Fermer
                    </button>
                </div>
            </aside>
        </>
    );
}

export default DepensePane;
