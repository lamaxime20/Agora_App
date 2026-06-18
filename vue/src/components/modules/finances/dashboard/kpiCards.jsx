import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ShoppingCart, Clock, Wallet } from "lucide-react";

const KPI_CONFIG = [
    { key: "total_entrees",                  label: "Entrées",                  icon: ArrowUpRight,  color: "success", unit: "FCFA" },
    { key: "total_sorties",                  label: "Sorties",                  icon: ArrowDownRight,color: "error",   unit: "FCFA" },
    { key: "benefice_net",                   label: "Bénéfice net",             icon: Wallet,        color: "primary", unit: "FCFA" },
    { key: "commandes_en_attente_validation",label: "En attente validation",    icon: ShoppingCart,  color: "info",    unit: ""     },
    { key: "commandes_en_attente_paiement",  label: "En attente paiement",      icon: Clock,         color: "warning", unit: ""     },
];

function formatVal(n, unit) {
    if (unit === "FCFA") {
        return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n ?? 0) + " FCFA";
    }
    return String(n ?? 0);
}

function KpiCards({ loading, data }) {
    if (loading) {
        return (
            <div className="finDash-kpis">
                {KPI_CONFIG.map(k => (
                    <div key={k.key} className="finDash-kpi finDash-kpi--skeleton">
                        <div className="finDash-skeleton finDash-skeleton--icon" />
                        <div className="finDash-skeleton finDash-skeleton--label" />
                        <div className="finDash-skeleton finDash-skeleton--value" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="finDash-kpis">
            {KPI_CONFIG.map(({ key, label, icon: Icon, color, unit }) => {
                const value = data?.[key] ?? 0;
                const variation = data?.variations?.[key];
                const positive = variation == null || variation >= 0;

                return (
                    <article key={key} className={`finDash-kpi finDash-kpi--${color}`}>
                        <div className={`finDash-kpi__icon`}>
                            <Icon size={18} aria-hidden="true" />
                        </div>
                        <p className="finDash-kpi__label">{label}</p>
                        <p className="finDash-kpi__value">{formatVal(value, unit)}</p>
                        {variation != null && (
                            <span className={`finDash-kpi__variation ${positive ? "finDash-kpi__variation--up" : "finDash-kpi__variation--down"}`}>
                                {positive
                                    ? <TrendingUp size={11} aria-hidden="true" />
                                    : <TrendingDown size={11} aria-hidden="true" />
                                }
                                {positive ? "+" : ""}{variation}%
                            </span>
                        )}
                    </article>
                );
            })}
        </div>
    );
}

export default KpiCards;
