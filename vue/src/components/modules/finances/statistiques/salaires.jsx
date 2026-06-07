import { useEffect, useState } from "react";
import { Users, TrendingDown } from "lucide-react";
import { fetchStatsAutres } from "../../../../services/financesP5.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

function StatsSalaires() {
    const [loading, setLoading] = useState(true);
    const [data, setData]       = useState(null);

    useEffect(() => {
        fetchStatsAutres()
            .then(d => { setData(d.salaires); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="finStats-tab-content"><div className="finStats-skeleton" style={{ height: 240 }} /></div>;
    if (!data)   return <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Données indisponibles.</p>;

    const maxRep = Math.max(...data.repartition.map(r => r.montant));

    return (
        <div className="finStats-tab-content">
            <div className="finStats-kpis">
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--expense">
                        <TrendingDown size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Masse salariale mensuelle</p>
                    <p className="finStats-kpi__value finStats-kpi__value--error">{fmt(data.masseSalariale)}</p>
                </div>
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--orders">
                        <Users size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Effectif salarié</p>
                    <p className="finStats-kpi__value">{data.nombreSalaries}</p>
                </div>
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--balance">
                        <Users size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Variation mensuelle</p>
                    <p className="finStats-kpi__value finStats-kpi__value--primary">{data.variationMensuelle}%</p>
                </div>
            </div>

            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Répartition par poste</p>
                <div className="finStats-categories">
                    {data.repartition.map(r => (
                        <div key={r.poste} className="finStats-category-row">
                            <span className="finStats-category-row__label">{r.poste}</span>
                            <div className="finStats-category-row__bar-wrap">
                                <div
                                    className="finStats-category-row__bar finStats-category-row__bar--expense"
                                    style={{ width: `${Math.round((r.montant / maxRep) * 100)}%` }}
                                    role="progressbar"
                                    aria-valuenow={Math.round((r.montant / maxRep) * 100)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                />
                            </div>
                            <span className="finStats-category-row__amount">{fmt(r.montant)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default StatsSalaires;
