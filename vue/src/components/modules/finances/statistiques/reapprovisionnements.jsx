import { useEffect, useState } from "react";
import { Truck, CheckCircle, XCircle } from "lucide-react";
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
                            style={{ height: `${Math.round((d.montant / maxVal) * 100)}%`, background: "#3498DB" }}
                            title={`${d.mois}: ${fmt(d.montant)}`}
                        />
                    </div>
                    <span className="finStats-barchart__label">{d.mois}</span>
                </div>
            ))}
        </div>
    );
}

function StatsReapprovisionnements() {
    const [loading, setLoading] = useState(true);
    const [data, setData]       = useState(null);

    useEffect(() => {
        fetchStatsAutres()
            .then(d => { setData(d.reapprovisionnements); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="finStats-tab-content"><div className="finStats-skeleton" style={{ height: 240 }} /></div>;
    if (!data)   return <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Données indisponibles.</p>;

    return (
        <div className="finStats-tab-content">
            <div className="finStats-kpis">
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap" style={{ background: "rgba(52,152,219,0.12)", color: "#3498DB" }}>
                        <Truck size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Montant engagé</p>
                    <p className="finStats-kpi__value" style={{ color: "#3498DB" }}>{fmt(data.montantEngage)}</p>
                </div>
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--income">
                        <CheckCircle size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Montant validé</p>
                    <p className="finStats-kpi__value finStats-kpi__value--success">{fmt(data.montantValide)}</p>
                </div>
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--expense">
                        <XCircle size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Montant refusé</p>
                    <p className="finStats-kpi__value finStats-kpi__value--error">{fmt(data.montantRefuse)}</p>
                </div>
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap" style={{ background: "rgba(52,152,219,0.12)", color: "#3498DB" }}>
                        <Truck size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Volume d'achats</p>
                    <p className="finStats-kpi__value">{data.volumeAchats}</p>
                </div>
            </div>

            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Montants engagés par mois</p>
                <BarChart data={data.parMois} />
            </div>
        </div>
    );
}

export default StatsReapprovisionnements;
