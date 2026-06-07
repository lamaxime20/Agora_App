import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";
import { fetchStatsAutres } from "../../../../services/financesP5.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

function DualBarChart({ data }) {
    const maxVal = Math.max(...data.map(d => Math.max(d.entrees, d.sorties)));
    return (
        <div className="finStats-barchart finStats-barchart--dual">
            {data.map(d => (
                <div key={d.mois} className="finStats-barchart__col">
                    <div className="finStats-barchart__bars">
                        <div
                            className="finStats-barchart__bar finStats-barchart__bar--entree"
                            style={{ height: `${Math.round((d.entrees / maxVal) * 100)}%`, background: "var(--color-success)" }}
                            title={`Entrées ${d.mois}: ${fmt(d.entrees)}`}
                        />
                        <div
                            className="finStats-barchart__bar finStats-barchart__bar--sortie"
                            style={{ height: `${Math.round((d.sorties / maxVal) * 100)}%`, background: "var(--color-error)" }}
                            title={`Sorties ${d.mois}: ${fmt(d.sorties)}`}
                        />
                    </div>
                    <span className="finStats-barchart__label">{d.mois}</span>
                </div>
            ))}
        </div>
    );
}

function FluxFinanciers() {
    const [loading, setLoading] = useState(true);
    const [data, setData]       = useState(null);

    useEffect(() => {
        fetchStatsAutres()
            .then(d => { setData(d.flux); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="finStats-tab-content"><div className="finStats-skeleton" style={{ height: 240 }} /></div>;
    if (!data)   return <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Données indisponibles.</p>;

    const dernierMois    = data.parMois[data.parMois.length - 1];
    const totalEntrees   = data.parMois.reduce((s, d) => s + d.entrees, 0);
    const totalSorties   = data.parMois.reduce((s, d) => s + d.sorties, 0);
    const soldeNet       = totalEntrees - totalSorties;

    return (
        <div className="finStats-tab-content">
            <div className="finStats-kpis">
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--income">
                        <ArrowUpRight size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Entrées totales</p>
                    <p className="finStats-kpi__value finStats-kpi__value--success">{fmt(totalEntrees)}</p>
                </div>
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--expense">
                        <ArrowDownLeft size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Sorties totales</p>
                    <p className="finStats-kpi__value finStats-kpi__value--error">{fmt(totalSorties)}</p>
                </div>
                <div className="finStats-kpi">
                    <div className={`finStats-kpi__icon-wrap ${soldeNet >= 0 ? "finStats-kpi__icon-wrap--income" : "finStats-kpi__icon-wrap--expense"}`}>
                        <TrendingUp size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Solde net cumulé</p>
                    <p className={`finStats-kpi__value ${soldeNet >= 0 ? "finStats-kpi__value--success" : "finStats-kpi__value--error"}`}>
                        {fmt(soldeNet)}
                    </p>
                </div>
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--balance">
                        <TrendingUp size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Net ce mois</p>
                    <p className="finStats-kpi__value finStats-kpi__value--primary">{fmt(dernierMois.net)}</p>
                </div>
            </div>

            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Entrées vs Sorties par mois</p>
                <div className="finStats-barchart-legend">
                    <span><span className="finStats-barchart-legend__dot finStats-barchart-legend__dot--entree" />Entrées</span>
                    <span><span className="finStats-barchart-legend__dot finStats-barchart-legend__dot--sortie" />Sorties</span>
                </div>
                <DualBarChart data={data.parMois} />
            </div>

            {/* Résumé mensuel */}
            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Solde net par mois</p>
                <div className="finStats-categories">
                    {data.parMois.map(d => (
                        <div key={d.mois} className="finStats-category-row">
                            <span className="finStats-category-row__label">{d.mois}</span>
                            <div className="finStats-category-row__bar-wrap">
                                <div
                                    className="finStats-category-row__bar"
                                    style={{
                                        width: `${Math.round((d.net / Math.max(...data.parMois.map(m => m.net))) * 100)}%`,
                                        background: d.net >= 0 ? "var(--color-success)" : "var(--color-error)",
                                    }}
                                    role="progressbar"
                                    aria-valuenow={d.net}
                                    aria-valuemin={0}
                                    aria-valuemax={Math.max(...data.parMois.map(m => m.net))}
                                />
                            </div>
                            <span className="finStats-category-row__amount">{fmt(d.net)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default FluxFinanciers;
