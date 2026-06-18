import { useEffect, useState } from "react";
import { CreditCard, TrendingDown } from "lucide-react";
import { fetchStatsAutres } from "../../../../services/financesP5.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

function BarChart({ data }) {
    const maxVal = Math.max(...data.map(d => d.montant));
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

function Depenses() {
    const [loading, setLoading] = useState(true);
    const [data, setData]       = useState(null);

    useEffect(() => {
        fetchStatsAutres()
            .then(d => {
                const evolution    = d.depenses?.evolution ?? [];
                const montantTotal = evolution.reduce((s, e) => s + (e.montant ?? 0), 0);
                const moyenne      = evolution.length ? montantTotal / evolution.length : 0;
                setData({ montantTotal, moyenne, parMois: evolution });
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
                        <CreditCard size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Total dépenses</p>
                    <p className="finStats-kpi__value finStats-kpi__value--error">{fmt(data.montantTotal)}</p>
                </div>
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--expense">
                        <TrendingDown size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Moyenne mensuelle</p>
                    <p className="finStats-kpi__value finStats-kpi__value--error">{fmt(data.moyenne)}</p>
                </div>
            </div>

            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Évolution mensuelle des dépenses</p>
                <BarChart data={data.parMois} />
            </div>
        </div>
    );
}

export default Depenses;
