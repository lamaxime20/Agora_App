import { X, ArrowUpRight, ArrowDownRight, User, Calendar, Hash, FileText } from "lucide-react";

function ActivitePane({ activite, onClose }) {
    if (!activite) return null;

    const fmt = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        }).format(new Date(d));

    const isEntree = activite.type === "entree";

    const rows = [
        { icon: Calendar, key: "Date",        val: formatDate(activite.date) },
        { icon: Hash,     key: "Référence",   val: activite.reference || "—" },
        { icon: User,     key: "Opérateur",   val: activite.utilisateur },
        { icon: FileText, key: "Description", val: activite.description },
    ];

    return (
        <>
            <div className="finDash-pane__overlay" onClick={onClose} aria-hidden="true" />
            <aside
                className="finDash-pane"
                role="complementary"
                aria-label={`Détail du mouvement : ${activite.titre}`}
            >
                <div className="finDash-pane__handle">
                    <div className="finDash-pane__handle-bar" />
                </div>

                <div className="finDash-pane__header">
                    <div className="finDash-pane__header-left">
                        <div className={`finDash-pane__type-badge ${isEntree ? "finDash-pane__type-badge--entree" : "finDash-pane__type-badge--sortie"}`}>
                            {isEntree
                                ? <ArrowUpRight size={14} aria-hidden="true" />
                                : <ArrowDownRight size={14} aria-hidden="true" />
                            }
                            {isEntree ? "Entrée" : "Sortie"}
                        </div>
                        <h2 className="finDash-pane__title">{activite.titre}</h2>
                    </div>
                    <button
                        className="finDash-pane__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finDash-pane__body">
                    {/* Montant mis en avant */}
                    <div className={`finDash-pane__amount-block ${isEntree ? "finDash-pane__amount-block--entree" : "finDash-pane__amount-block--sortie"}`}>
                        <span className="finDash-pane__amount-label">Montant</span>
                        <span className="finDash-pane__amount-value">
                            {isEntree ? "+" : "−"} {fmt(activite.montant)}
                        </span>
                    </div>

                    {/* Détails */}
                    <section className="finDash-pane__section">
                        <p className="finDash-pane__section-label">Informations</p>
                        {rows.map(({ icon: Icon, key, val }) => (
                            <div key={key} className="finDash-pane__row">
                                <span className="finDash-pane__row-key">
                                    <Icon size={14} aria-hidden="true" />
                                    {key}
                                </span>
                                <span className="finDash-pane__row-val">{val}</span>
                            </div>
                        ))}
                    </section>
                </div>
            </aside>
        </>
    );
}

export default ActivitePane;
