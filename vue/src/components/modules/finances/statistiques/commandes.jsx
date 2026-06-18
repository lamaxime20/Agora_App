import { useEffect, useState } from "react";
import { ShoppingCart, TrendingUp } from "lucide-react";
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
                            style={{ height: `${Math.round((d.montant / maxVal) * 100)}%`, background: "var(--color-success)" }}
                            title={`${d.mois}: ${fmt(d.montant)}`}
                        />
                    </div>
                    <span className="finStats-barchart__label">{d.mois}</span>
                </div>
            ))}
        </div>
    );
}

function Commandes() {
    const [loading, setLoading] = useState(true);
    const [data, setData]       = useState(null);

    useEffect(() => {
        fetchStatsAutres()
            .then(d => {
                const raw    = d.commandes_paiements ?? {};
                const modes  = raw.modes ?? [];
                setData({
                    nombreCommandes: modes.reduce((s, m) => s + (m.count   ?? 0), 0),
                    montantEncaisse: modes.reduce((s, m) => s + (m.montant ?? 0), 0),
                    parMois:         raw.evolution ?? [],
                });
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
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--orders">
                        <ShoppingCart size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Commandes payées</p>
                    <p className="finStats-kpi__value">{data.nombreCommandes}</p>
                </div>
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--income">
                        <TrendingUp size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Montant encaissé</p>
                    <p className="finStats-kpi__value finStats-kpi__value--success">{fmt(data.montantEncaisse)}</p>
                </div>
            </div>

            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Montants encaissés par mois</p>
                <BarChart data={data.parMois} />
            </div>
        </div>
    );
}

export default Commandes;
