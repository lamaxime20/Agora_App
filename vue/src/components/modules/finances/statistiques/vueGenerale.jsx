import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, RotateCcw, CreditCard, Users, Repeat, Truck, Wallet } from "lucide-react";
import { fetchStatsVueGenerale } from "../../../../services/financesP5.js";

const fmt = (n) =>
    n >= 1000000
        ? `${(n / 1000000).toFixed(1).replace(".", ",")} M XAF`
        : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

function BarChart({ data, colorEntree = "var(--color-success)", colorSortie = "var(--color-error)" }) {
    const maxVal = Math.max(...data.map(d => Math.max(d.entrees ?? 0, d.sorties ?? 0, d.montant ?? 0)));
    return (
        <div className="finStats-barchart">
            {data.map(d => (
                <div key={d.mois} className="finStats-barchart__col">
                    <div className="finStats-barchart__bars">
                        {d.entrees !== undefined && (
                            <div
                                className="finStats-barchart__bar finStats-barchart__bar--entree"
                                style={{ height: `${Math.round((d.entrees / maxVal) * 100)}%`, background: colorEntree }}
                                title={`Entrées ${d.mois}: ${fmt(d.entrees)}`}
                            />
                        )}
                        {d.sorties !== undefined && (
                            <div
                                className="finStats-barchart__bar finStats-barchart__bar--sortie"
                                style={{ height: `${Math.round((d.sorties / maxVal) * 100)}%`, background: colorSortie }}
                                title={`Sorties ${d.mois}: ${fmt(d.sorties)}`}
                            />
                        )}
                        {d.montant !== undefined && (
                            <div
                                className="finStats-barchart__bar"
                                style={{ height: `${Math.round((d.montant / maxVal) * 100)}%`, background: colorEntree }}
                                title={`${d.mois}: ${fmt(d.montant)}`}
                            />
                        )}
                    </div>
                    <span className="finStats-barchart__label">{d.mois}</span>
                </div>
            ))}
        </div>
    );
}

function HBarChart({ data, maxVal }) {
    const max = maxVal ?? Math.max(...data.map(d => d.montant));
    return (
        <div className="finStats-categories">
            {data.map(d => (
                <div key={d.categorie ?? d.label ?? d.nom} className="finStats-category-row">
                    <span className="finStats-category-row__label">{d.categorie ?? d.label ?? d.nom}</span>
                    <div className="finStats-category-row__bar-wrap">
                        <div
                            className="finStats-category-row__bar"
                            style={{
                                width: `${Math.round((d.montant / max) * 100)}%`,
                                background: d.couleur ?? "var(--color-primary)",
                            }}
                            role="progressbar"
                            aria-valuenow={Math.round((d.montant / max) * 100)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        />
                    </div>
                    <span className="finStats-category-row__amount">{fmt(d.montant)}</span>
                </div>
            ))}
        </div>
    );
}

const KPI_CONFIG = [
    { key: "argentVirtuel",            label: "Trésorerie actuelle",       icon: Wallet,       cls: "finStats-kpi__value--primary" },
    { key: "entrees",                  label: "Entrées (cumul)",           icon: TrendingUp,   cls: "finStats-kpi__value--success" },
    { key: "sorties",                  label: "Sorties (cumul)",           icon: TrendingDown, cls: "finStats-kpi__value--error" },
    { key: "beneficeNet",              label: "Bénéfice net",              icon: DollarSign,   cls: "finStats-kpi__value--success" },
    { key: "commandesPayees",          label: "Commandes payées",          icon: ShoppingCart, cls: "" },
    { key: "montantRemboursements",    label: "Remboursements",            icon: RotateCcw,    cls: "finStats-kpi__value--error" },
    { key: "montantDepenses",          label: "Dépenses opérationnelles",  icon: CreditCard,   cls: "finStats-kpi__value--error" },
    { key: "montantSalaires",          label: "Masse salariale",           icon: Users,        cls: "finStats-kpi__value--error" },
    { key: "montantAbonnements",       label: "Abonnements",               icon: Repeat,       cls: "finStats-kpi__value--error" },
    { key: "montantReapprovisionnements", label: "Réapprovisionnements",   icon: Truck,        cls: "finStats-kpi__value--error" },
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
            {/* 10 KPIs */}
            <div className="finStats-kpis finStats-kpis--5col">
                {KPI_CONFIG.map(({ key, label, icon: Icon, cls }) => (
                    <article key={key} className="finStats-kpi">
                        <div className={`finStats-kpi__icon-wrap finStats-kpi__icon-wrap--${cls.includes("success") ? "income" : cls.includes("error") ? "expense" : "balance"}`}>
                            <Icon size={18} aria-hidden="true" />
                        </div>
                        <p className="finStats-kpi__label">{label}</p>
                        <p className={`finStats-kpi__value ${cls}`}>
                            {typeof stats.kpis[key] === "number" && stats.kpis[key] > 999
                                ? fmt(stats.kpis[key])
                                : stats.kpis[key]}
                        </p>
                        {stats.tendances?.[key] !== undefined && (
                            <p className={`finStats-kpi__trend ${stats.tendances[key] >= 0 ? "finStats-kpi__trend--up" : "finStats-kpi__trend--down"}`}>
                                {stats.tendances[key] >= 0 ? "+" : ""}{stats.tendances[key]}% vs mois préc.
                            </p>
                        )}
                    </article>
                ))}
            </div>

            {/* Flux mensuels */}
            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Flux mensuels — Entrées vs Sorties</p>
                <div className="finStats-barchart-legend">
                    <span><span className="finStats-barchart-legend__dot finStats-barchart-legend__dot--entree" />Entrées</span>
                    <span><span className="finStats-barchart-legend__dot finStats-barchart-legend__dot--sortie" />Sorties</span>
                </div>
                <BarChart data={stats.fluxMensuels} />
            </div>

            {/* Répartition dépenses */}
            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Répartition des sorties par catégorie</p>
                <HBarChart data={stats.repartitionDepenses} />
            </div>
        </div>
    );
}

export default VueGenerale;
