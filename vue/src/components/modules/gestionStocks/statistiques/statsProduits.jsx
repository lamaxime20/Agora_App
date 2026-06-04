import { ShoppingCart, TrendingUp, TrendingDown, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { useStatistiques, formatFCFA } from "../../../../services/useStatistiques.js";
import StatCard, { StatCardSkeleton } from "./shared/StatCard.jsx";
import BarChart from "./shared/BarChart.jsx";
import DataTable from "./shared/DataTable.jsx";
import "../../../../assets/styles/components/modules/gestionStocks/statsProduits.css";

/* ─── ChartCard ───────────────────────────────────────────────────────────────── */

function ChartCard({ title, subtitle, children, skeleton, delay = 0 }) {
    return (
        <div className="chartCard-root" style={{ animationDelay: `${delay}ms` }}>
            <div className="chartCard-header">
                <div className="chartCard-header__text">
                    <p className="chartCard-title">{title}</p>
                    {subtitle && <p className="chartCard-subtitle">{subtitle}</p>}
                </div>
            </div>
            <div className="chartCard-body">
                {skeleton ? <div className="chartCard-skeleton" /> : children}
            </div>
        </div>
    );
}

/* ─── Colonnes tableau ────────────────────────────────────────────────────────── */

const COLUMNS = [
    { key: "nom",       label: "Produit",     sortable: true,  render: (v) => <span className="statsProd-table__name">{v}</span> },
    { key: "categorie", label: "Catégorie",   sortable: true  },
    { key: "quantite",  label: "Qté vendue",  sortable: true,  align: "right",
      render: (v) => <span className="statsProd-table__num">{v?.toLocaleString("fr-FR")}</span> },
    { key: "ca",        label: "CA (FCFA)",   sortable: true,  align: "right",
      render: (v) => <span className="statsProd-table__ca">{v?.toLocaleString("fr-FR")}</span> },
    { key: "croissance", label: "Croissance", sortable: true, align: "right",
      render: (v) => {
          if (v == null) return "—";
          const isPos = v > 0;
          const mod   = v === 0 ? "neutral" : isPos ? "up" : "down";
          const sign  = isPos ? "+" : "";
          return <span className={`statsProd-badge statsProd-badge--${mod}`}>{sign}{v.toFixed(1)} %</span>;
      }
    },
];

/* ─── StatsProduits ───────────────────────────────────────────────────────────── */

function StatsProduits() {
    const { data, loading, error, refresh } = useStatistiques("produits");

    if (error) {
        return (
            <div className="statsError-root" role="alert">
                <AlertCircle size={32} aria-hidden="true" />
                <p>{error}</p>
                <button className="app-button app-button--ghost app-button--sm" onClick={refresh} type="button">
                    <RefreshCw size={13} aria-hidden="true" />
                    Réessayer
                </button>
            </div>
        );
    }

    const k = data?.kpis;

    return (
        <div className="statsProd-root">

            {/* ─── En-tête ─────────────────────────────────────────── */}
            <div className="statsProd-header">
                <h2 className="statsProd-title">Produits</h2>
                <p className="statsProd-subtitle">Performances de vente par produit</p>
            </div>

            {/* ─── KPIs ────────────────────────────────────────────── */}
            <div className="statsProd-kpis">
                {loading ? (
                    <StatCardSkeleton count={4} />
                ) : (
                    <>
                        <StatCard
                            icon={TrendingUp}   iconMod="success"
                            label="Top ventes"
                            value={k.topVenduNom}
                            description={`${k.topVenduQty?.toLocaleString("fr-FR")} unités vendues`}
                            delay={0}
                        />
                        <StatCard
                            icon={TrendingDown}  iconMod="error"
                            label="Moins vendu"
                            value={k.moinsVenduNom}
                            description={`${k.moinsVenduQty} unités vendues`}
                            delay={60}
                        />
                        <StatCard
                            icon={DollarSign}    iconMod="primary"
                            label="Meilleur CA"
                            value={k.maxCANom}
                            description={formatFCFA(k.maxCAValeur)}
                            delay={120}
                        />
                        <StatCard
                            icon={ShoppingCart}  iconMod="warning"
                            label="CA minimum"
                            value={k.minCANom}
                            description={formatFCFA(k.minCAValeur)}
                            delay={180}
                        />
                    </>
                )}
            </div>

            {/* ─── Graphiques ──────────────────────────────────────── */}
            <div className="statsProd-charts">
                <ChartCard
                    title="Top produits — Quantités vendues"
                    subtitle="Nombre d'unités vendues"
                    skeleton={loading}
                    delay={80}
                >
                    {data && (
                        <BarChart
                            data={data.topParVente}
                            labelKey="nom"
                            valueKey="quantite"
                            color="var(--color-primary)"
                            unit="unités"
                        />
                    )}
                </ChartCard>

                <ChartCard
                    title="Top produits — Chiffre d'affaires"
                    subtitle="Revenus générés (FCFA)"
                    skeleton={loading}
                    delay={140}
                >
                    {data && (
                        <BarChart
                            data={data.topParCA}
                            labelKey="nom"
                            valueKey="ca"
                            color="var(--color-success)"
                            formatVal={(v) => v?.toLocaleString("fr-FR") + " FCFA"}
                        />
                    )}
                </ChartCard>
            </div>

            {/* ─── Tableau détail ───────────────────────────────────── */}
            {!loading && data?.tableau && (
                <ChartCard
                    title="Détail par produit"
                    subtitle="Triable par colonne"
                    delay={200}
                >
                    <DataTable
                        columns={COLUMNS}
                        data={data.tableau}
                        emptyText="Aucun produit disponible."
                    />
                </ChartCard>
            )}
        </div>
    );
}

export default StatsProduits;
