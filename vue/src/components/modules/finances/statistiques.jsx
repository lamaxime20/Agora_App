import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart2 } from "lucide-react";
import "../../../assets/styles/components/modules/finances/statistiques.css";

const KPI_DATA = [
    { key: "entrees",   label: "Entrées totales",   value: 7470000, iconWrap: "income",  icon: TrendingUp,   valueClass: "finStats-kpi__value--success" },
    { key: "depenses",  label: "Dépenses totales",  value:  539000, iconWrap: "expense", icon: TrendingDown, valueClass: "finStats-kpi__value--error" },
    { key: "solde",     label: "Solde net du mois", value: 6931000, iconWrap: "balance", icon: DollarSign,   valueClass: "finStats-kpi__value--primary" },
    { key: "commandes", label: "Commandes financées",value: 5,       iconWrap: "orders",  icon: ShoppingCart, valueClass: "" },
];

const DEPENSES_CAT = [
    { label: "Transport & carburant", montant: 250000, max: 539000 },
    { label: "Électricité / eau",     montant: 120000, max: 539000 },
    { label: "Fournitures de bureau", montant:  89000, max: 539000 },
    { label: "Communication",         montant:  45000, max: 539000 },
    { label: "Maintenance",           montant:  35000, max: 539000 },
];

const ENTREES_CAT = [
    { label: "Apport de capital",    montant: 5000000, max: 7470000 },
    { label: "Prêt bancaire reçu",   montant: 1200000, max: 7470000 },
    { label: "Subvention publique",  montant:  800000, max: 7470000 },
    { label: "Ventes produits",      montant:  320000, max: 7470000 },
    { label: "Remboursement reçu",   montant:  150000, max: 7470000 },
];

function Statistiques() {
    const formatMontant = (n) =>
        typeof n === "number" && n > 999
            ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n)
            : String(n);

    return (
        <section className="finStats-root" aria-label="Statistiques financières">
            <header className="finStats-header">
                <h1 className="finStats-header__title">Statistiques</h1>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Données de démonstration — juin 2026</span>
            </header>

            {/* KPIs */}
            <div className="finStats-kpis">
                {KPI_DATA.map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <article className="finStats-kpi" key={kpi.key}>
                            <div className={`finStats-kpi__icon-wrap finStats-kpi__icon-wrap--${kpi.iconWrap}`}>
                                <Icon size={18} aria-hidden="true" />
                            </div>
                            <p className="finStats-kpi__label">{kpi.label}</p>
                            <p className={`finStats-kpi__value ${kpi.valueClass}`}>
                                {formatMontant(kpi.value)}
                            </p>
                        </article>
                    );
                })}
            </div>

            {/* Graphique placeholder */}
            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Flux financiers mensuel</p>
                <div className="finStats-chart-placeholder" role="img" aria-label="Zone réservée au graphique (composant à intégrer)">
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-muted)" }}>
                        <BarChart2 size={20} aria-hidden="true" />
                        Graphique à intégrer
                    </span>
                </div>
            </div>

            {/* Répartition dépenses */}
            <div>
                <p className="finStats-section-title">Répartition des dépenses par catégorie</p>
                <div className="finStats-categories">
                    {DEPENSES_CAT.map(c => (
                        <div key={c.label} className="finStats-category-row">
                            <span className="finStats-category-row__label">{c.label}</span>
                            <div className="finStats-category-row__bar-wrap">
                                <div
                                    className="finStats-category-row__bar finStats-category-row__bar--expense"
                                    style={{ width: `${Math.round((c.montant / c.max) * 100)}%` }}
                                    role="progressbar"
                                    aria-valuenow={Math.round((c.montant / c.max) * 100)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                />
                            </div>
                            <span className="finStats-category-row__amount">{formatMontant(c.montant)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Répartition entrées */}
            <div>
                <p className="finStats-section-title">Répartition des entrées par origine</p>
                <div className="finStats-categories">
                    {ENTREES_CAT.map(c => (
                        <div key={c.label} className="finStats-category-row">
                            <span className="finStats-category-row__label">{c.label}</span>
                            <div className="finStats-category-row__bar-wrap">
                                <div
                                    className="finStats-category-row__bar finStats-category-row__bar--income"
                                    style={{ width: `${Math.round((c.montant / c.max) * 100)}%` }}
                                    role="progressbar"
                                    aria-valuenow={Math.round((c.montant / c.max) * 100)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                />
                            </div>
                            <span className="finStats-category-row__amount">{formatMontant(c.montant)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Statistiques;
