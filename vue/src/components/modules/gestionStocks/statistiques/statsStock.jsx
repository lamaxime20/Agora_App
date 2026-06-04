import { Banknote, BarChart2, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { useStatistiques, formatFCFA } from "../../../../services/useStatistiques.js";
import StatCard, { StatCardSkeleton } from "./shared/StatCard.jsx";
import BarChart from "./shared/BarChart.jsx";
import LineChart from "./shared/LineChart.jsx";
import DonutChart from "./shared/DonutChart.jsx";
import DataTable from "./shared/DataTable.jsx";
import "../../../../assets/styles/components/modules/gestionStocks/statsStock.css";

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

const STATUT_MAP = {
    ok:      { label: "Disponible", mod: "success" },
    faible:  { label: "Stock faible", mod: "warning" },
    rupture: { label: "Rupture",    mod: "error"   },
};

const COLUMNS = [
    { key: "nom",        label: "Produit",     sortable: true,
      render: (v) => <span className="statsStock-table__name">{v}</span> },
    { key: "categorie",  label: "Catégorie",   sortable: true },
    { key: "stock",      label: "Stock",       sortable: true, align: "right" },
    { key: "reserve",    label: "Réservé",     sortable: true, align: "right" },
    { key: "disponible", label: "Disponible",  sortable: true, align: "right",
      render: (v) => <span className="statsStock-table__dispo">{v}</span> },
    { key: "valeur",     label: "Valeur (FCFA)", sortable: true, align: "right",
      render: (v) => <span className="statsStock-table__valeur">{v?.toLocaleString("fr-FR")}</span> },
    { key: "statut",     label: "Statut",      sortable: true,
      render: (v) => {
          const cfg = STATUT_MAP[v] ?? { label: v, mod: "success" };
          return <span className={`statsStock-badge statsStock-badge--${cfg.mod}`}>{cfg.label}</span>;
      }
    },
];

/* ─── Couleurs donut catégories ───────────────────────────────────────────────── */

const CAT_COLORS = ["var(--color-primary)", "var(--color-info)", "var(--color-success)", "#94A3B8", "#CBD5E1"];

/* ─── StatsStock ──────────────────────────────────────────────────────────────── */

function StatsStock() {
    const { data, loading, error, refresh } = useStatistiques("stock");

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

    const donutData = data?.parCategorie
        ?.filter(c => c.valeur > 0)
        .map((c, i) => ({ ...c, color: CAT_COLORS[i % CAT_COLORS.length] })) ?? [];

    return (
        <div className="statsStock-root">

            <div className="statsStock-header">
                <h2 className="statsStock-title">Stock</h2>
                <p className="statsStock-subtitle">État et répartition du stock actuel</p>
            </div>

            {/* ─── KPIs ────────────────────────────────────────────── */}
            <div className="statsStock-kpis">
                {loading ? (
                    <StatCardSkeleton count={4} />
                ) : (
                    <>
                        <StatCard
                            icon={Banknote}        iconMod="success"
                            label="Valeur totale du stock"
                            rawValue={k.valeurTotale}
                            format={formatFCFA}
                            variation={k.variationValeur}
                            delay={0}
                        />
                        <StatCard
                            icon={BarChart2}        iconMod="primary"
                            label="Stock moyen / produit"
                            rawValue={k.stockMoyen}
                            description="unités en moyenne"
                            delay={60}
                        />
                        <StatCard
                            icon={AlertTriangle}    iconMod="warning"
                            label="Stocks faibles"
                            rawValue={k.produitsFaible}
                            variation={k.variationFaible}
                            description="seuil d'alerte"
                            delay={120}
                        />
                        <StatCard
                            icon={AlertCircle}      iconMod="error"
                            label="En rupture"
                            rawValue={k.produitsRupture}
                            description="à zéro"
                            delay={180}
                        />
                    </>
                )}
            </div>

            {/* ─── Graphiques ──────────────────────────────────────── */}
            <div className="statsStock-charts">
                <ChartCard
                    title="Valeur du stock par catégorie"
                    subtitle="Répartition en FCFA"
                    skeleton={loading}
                    delay={80}
                >
                    {donutData.length > 0 && (
                        <DonutChart
                            data={donutData}
                            valueKey="valeur"
                            labelKey="categorie"
                            colorKey="color"
                        />
                    )}
                </ChartCard>

                <ChartCard
                    title="Stock par catégorie"
                    subtitle="Nombre de produits"
                    skeleton={loading}
                    delay={130}
                >
                    {data?.parCategorie && (
                        <BarChart
                            data={data.parCategorie}
                            labelKey="categorie"
                            valueKey="nbProduits"
                            color="var(--color-info)"
                            unit="produits"
                        />
                    )}
                </ChartCard>

                <ChartCard
                    title="Évolution mensuelle du stock"
                    subtitle="Entrées, sorties et pertes"
                    skeleton={loading}
                    delay={180}
                >
                    {data?.evolutionMensuelle && (
                        <LineChart
                            data={data.evolutionMensuelle}
                            xKey="mois"
                            lines={[
                                { key: "entrees", color: "var(--color-success)", label: "Entrées"  },
                                { key: "sorties", color: "var(--color-primary)", label: "Sorties"  },
                                { key: "pertes",  color: "var(--color-error)",   label: "Pertes"   },
                            ]}
                            height={180}
                        />
                    )}
                </ChartCard>
            </div>

            {/* ─── Tableau ──────────────────────────────────────────── */}
            {!loading && data?.tableau && (
                <ChartCard title="Détail du stock par produit" subtitle="Triable par colonne" delay={240}>
                    <DataTable columns={COLUMNS} data={data.tableau} emptyText="Aucun produit." />
                </ChartCard>
            )}
        </div>
    );
}

export default StatsStock;
