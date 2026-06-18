import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { fetchStatsAutres } from "../../../../services/financesP5.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

function BarChart({ data }) {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.montant), 1);
    return (
        <div className="finStats-barchart">
            {data.map(d => (
                <div key={d.mois} className="finStats-barchart__col">
                    <div className="finStats-barchart__bars">
                        <div
                            className="finStats-barchart__bar"
                            style={{ height: `${Math.round((d.montant / maxVal) * 100)}%`, background: "var(--color-error)" }}
                            title={`${d.mois}: ${fmt(d.montant)}`}
                        />
                    </div>
                    <span className="finStats-barchart__label">{d.mois}</span>
                </div>
            ))}
        </div>
    );
}

function StatsSalaires() {
    const [loading, setLoading] = useState(true);
    const [data, setData]       = useState(null);

    useEffect(() => {
        fetchStatsAutres()
            .then(d => {
                const evolution        = d.salaires?.evolution ?? [];
                const last             = evolution[evolution.length - 1]?.montant ?? 0;
                const prev             = evolution.length >= 2 ? evolution[evolution.length - 2].montant : null;
                const variationMensuelle = prev != null && prev !== 0
                    ? parseFloat(((last - prev) / Math.abs(prev) * 100).toFixed(1))
                    : null;
                setData({ masseSalariale: last, variationMensuelle, evolution });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="finStats-tab-content"><div className="finStats-skeleton" style={{ height: 240 }} /></div>;
    if (!data)   return <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Données indisponibles.</p>;

    return (
        <div className="finStats-tab-content">
            <div className="finStats-kpis">
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--expense">
                        <TrendingDown size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Masse salariale (dernier mois)</p>
                    <p className="finStats-kpi__value finStats-kpi__value--error">{fmt(data.masseSalariale)}</p>
                </div>
                {data.variationMensuelle !== null && (
                    <div className="finStats-kpi">
                        <div className={`finStats-kpi__icon-wrap ${data.variationMensuelle >= 0 ? "finStats-kpi__icon-wrap--expense" : "finStats-kpi__icon-wrap--income"}`}>
                            {data.variationMensuelle >= 0
                                ? <TrendingUp size={18} aria-hidden="true" />
                                : <TrendingDown size={18} aria-hidden="true" />
                            }
                        </div>
                        <p className="finStats-kpi__label">Variation mensuelle</p>
                        <p className={`finStats-kpi__value ${data.variationMensuelle >= 0 ? "finStats-kpi__value--error" : "finStats-kpi__value--success"}`}>
                            {data.variationMensuelle >= 0 ? "+" : ""}{data.variationMensuelle}%
                        </p>
                    </div>
                )}
            </div>

            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Évolution mensuelle de la masse salariale</p>
                <BarChart data={data.evolution} />
            </div>
        </div>
    );
}

export default StatsSalaires;
