import { useEffect, useState } from "react";
import { Repeat } from "lucide-react";
import { fetchStatsAutres } from "../../../../services/financesP5.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

function StatsAbonnements() {
    const [loading, setLoading] = useState(true);
    const [data, setData]       = useState(null);

    useEffect(() => {
        fetchStatsAutres()
            .then(d => { setData(d.abonnements); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="finStats-tab-content"><div className="finStats-skeleton" style={{ height: 240 }} /></div>;
    if (!data)   return <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Données indisponibles.</p>;

    const maxF = Math.max(...data.repartitionFournisseurs.map(f => f.montant));

    return (
        <div className="finStats-tab-content">
            <div className="finStats-kpis">
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--expense">
                        <Repeat size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Coût récurrent mensuel</p>
                    <p className="finStats-kpi__value finStats-kpi__value--error">{fmt(data.coutRecurrentMensuel)}</p>
                </div>
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--orders">
                        <Repeat size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Abonnements actifs</p>
                    <p className="finStats-kpi__value">{data.nombreAbonnements}</p>
                </div>
            </div>

            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Répartition par fournisseur</p>
                <div className="finStats-categories">
                    {data.repartitionFournisseurs.map(f => (
                        <div key={f.fournisseur} className="finStats-category-row">
                            <span className="finStats-category-row__label">{f.fournisseur}</span>
                            <div className="finStats-category-row__bar-wrap">
                                <div
                                    className="finStats-category-row__bar finStats-category-row__bar--expense"
                                    style={{ width: `${Math.round((f.montant / maxF) * 100)}%` }}
                                    role="progressbar"
                                    aria-valuenow={Math.round((f.montant / maxF) * 100)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                />
                            </div>
                            <span className="finStats-category-row__amount">{fmt(f.montant)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default StatsAbonnements;
