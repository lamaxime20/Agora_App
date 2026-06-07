import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import ActivitePane from "./activitePane.jsx";

function ActiviteRecente({ loading, activites }) {
    const [selected, setSelected] = useState(null);

    const fmt = (n) =>
        new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(d));

    if (loading) {
        return (
            <div className="finDash-activite">
                <div className="finDash-activite__header">
                    <div className="finDash-skeleton finDash-skeleton--title" />
                </div>
                <div className="finDash-activite__list">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="finDash-activite__item--skeleton">
                            <div className="finDash-skeleton finDash-skeleton--icon-sm" />
                            <div className="finDash-activite__item-body--skeleton">
                                <div className="finDash-skeleton finDash-skeleton--line" />
                                <div className="finDash-skeleton finDash-skeleton--label" />
                            </div>
                            <div className="finDash-skeleton finDash-skeleton--amount" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const list = activites ?? [];

    if (list.length === 0) {
        return (
            <div className="finDash-activite">
                <div className="finDash-activite__header">
                    <p className="finDash-activite__title">Activité récente</p>
                </div>
                <div className="finDash-activite__empty">
                    <Activity size={32} aria-hidden="true" />
                    <p>Aucun mouvement récent.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="finDash-activite">
                <div className="finDash-activite__header">
                    <p className="finDash-activite__title">Activité récente</p>
                    <span className="finDash-activite__count">{list.length}</span>
                </div>
                <ul className="finDash-activite__list" role="list">
                    {list.map(act => {
                        const isEntree = act.type === "entree";
                        return (
                            <li key={act.id}>
                                <button
                                    className="finDash-activite__item"
                                    onClick={() => setSelected(act)}
                                    type="button"
                                    aria-label={`Voir détail : ${act.titre}`}
                                >
                                    <div className={`finDash-activite__icon ${isEntree ? "finDash-activite__icon--entree" : "finDash-activite__icon--sortie"}`}>
                                        {isEntree
                                            ? <ArrowUpRight size={16} aria-hidden="true" />
                                            : <ArrowDownRight size={16} aria-hidden="true" />
                                        }
                                    </div>
                                    <div className="finDash-activite__body">
                                        <span className="finDash-activite__item-title">{act.titre}</span>
                                        <span className="finDash-activite__item-date">{formatDate(act.date)}</span>
                                    </div>
                                    <span className={`finDash-activite__montant ${isEntree ? "finDash-activite__montant--entree" : "finDash-activite__montant--sortie"}`}>
                                        {isEntree ? "+" : "−"}{fmt(act.montant)}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {selected && (
                <ActivitePane activite={selected} onClose={() => setSelected(null)} />
            )}
        </>
    );
}

export default ActiviteRecente;
