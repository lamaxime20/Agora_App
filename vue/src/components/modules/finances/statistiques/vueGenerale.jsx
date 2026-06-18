import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, RotateCcw, CreditCard, Users, Repeat, Truck, Wallet } from "lucide-react";
import { fetchStatsVueGenerale } from "../../../../services/financesP5.js";

const fmt = (n) =>
    n >= 1000000
        ? `${(n / 1000000).toFixed(1).replace(".", ",")} M XAF`
        : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const KPI_CONFIG = [
    { key: "argent_virtuel_actuel",        label: "Trésorerie actuelle",       icon: Wallet,       cls: "finStats-kpi__value--primary" },
    { key: "total_entrees",                label: "Entrées (cumul)",           icon: TrendingUp,   cls: "finStats-kpi__value--success" },
    { key: "total_sorties",                label: "Sorties (cumul)",           icon: TrendingDown, cls: "finStats-kpi__value--error" },
    { key: "benefice_net",                 label: "Bénéfice net",              icon: DollarSign,   cls: "finStats-kpi__value--success" },
    { key: "nb_commandes_payees",          label: "Commandes payées",          icon: ShoppingCart, cls: "" },
    { key: "total_remboursements",         label: "Remboursements",            icon: RotateCcw,    cls: "finStats-kpi__value--error" },
    { key: "total_depenses",               label: "Dépenses opérationnelles",  icon: CreditCard,   cls: "finStats-kpi__value--error" },
    { key: "total_salaires",               label: "Masse salariale",           icon: Users,        cls: "finStats-kpi__value--error" },
    { key: "total_abonnements",            label: "Abonnements",               icon: Repeat,       cls: "finStats-kpi__value--error" },
    { key: "total_reapprovisionnements",   label: "Réapprovisionnements",      icon: Truck,        cls: "finStats-kpi__value--error" },
];

function KpiSkeleton() {
    return (
        <div className="finStats-kpis finStats-kpis--5col">
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} className="finStats-kpi">
                    <div className="finStats-skeleton finStats-skeleton--sm" />
                    <div className="finStats-skeleton finStats-skeleton--md" style={{ marginTop: 6 }} />
                </div>
            ))}
        </div>
    );
}

function VueGenerale() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats]     = useState(null);

    useEffect(() => {
        fetchStatsVueGenerale()
            .then(d => { setStats(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <KpiSkeleton />;
    if (!stats)  return <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Données indisponibles.</p>;

    return (
        <div className="finStats-tab-content">
            <div className="finStats-kpis finStats-kpis--5col">
                {KPI_CONFIG.map(({ key, label, icon: Icon, cls }) => {
                    const val = stats[key];
                    return (
                        <article key={key} className="finStats-kpi">
                            <div className={`finStats-kpi__icon-wrap finStats-kpi__icon-wrap--${cls.includes("success") ? "income" : cls.includes("error") ? "expense" : "balance"}`}>
                                <Icon size={18} aria-hidden="true" />
                            </div>
                            <p className="finStats-kpi__label">{label}</p>
                            <p className={`finStats-kpi__value ${cls}`}>
                                {typeof val === "number" && val > 999 ? fmt(val) : (val ?? 0)}
                            </p>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default VueGenerale;
