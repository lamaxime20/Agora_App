import { X } from "lucide-react";

function EntreePane({ entree, onClose }) {
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
                className="finEnt-drawer__overlay"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finEnt-drawer"
                role="complementary"
                aria-label={`Détails de l'entrée ${entree.id}`}
            >
                <div className="finEnt-drawer__handle">
                    <div className="finEnt-drawer__handle-bar" />
                </div>

                <div className="finEnt-drawer__header">
                    <h2 className="finEnt-drawer__title">Entrée {entree.id}</h2>
                    <button
                        className="finEnt-drawer__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finEnt-drawer__body">
                    <section>
                        <p className="finEnt-detail__section-label">Détails de l'entrée</p>
                        <div className="finEnt-detail__row">
                            <span className="finEnt-detail__key">Référence</span>
                            <span className="finEnt-detail__val">{entree.id}</span>
                        </div>
                        <div className="finEnt-detail__row">
                            <span className="finEnt-detail__key">Date</span>
                            <span className="finEnt-detail__val">{formatDate(entree.date_entree)}</span>
                        </div>
                        <div className="finEnt-detail__row">
                            <span className="finEnt-detail__key">Enregistré par</span>
                            <span className="finEnt-detail__val">
                                <span className="fin-badge">{entree.enregistre_par}</span>
                            </span>
                        </div>
                        <div className="finEnt-detail__row">
                            <span className="finEnt-detail__key">Montant encaissé</span>
                            <span className="finEnt-detail__val finEnt-detail__val--amount" style={{ color: "var(--color-success)" }}>
                                {formatMontant(entree.montant)}
                            </span>
                        </div>
                        <div className="finEnt-detail__row" style={{ flexDirection: "column", gap: "var(--space-2)" }}>
                            <span className="finEnt-detail__key">Description</span>
                            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", margin: 0, lineHeight: "1.6" }}>
                                {entree.raison}
                            </p>
                        </div>
                    </section>
                </div>

                <div className="finEnt-drawer__footer">
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

export default EntreePane;
