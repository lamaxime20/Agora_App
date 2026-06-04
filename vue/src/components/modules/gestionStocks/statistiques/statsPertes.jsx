import { AlertTriangle, Banknote, Package2, Tag, AlertCircle, RefreshCw } from "lucide-react";
import { useStatistiques, formatFCFA } from "../../../../services/useStatistiques.js";
import StatCard, { StatCardSkeleton } from "./shared/StatCard.jsx";
import BarChart from "./shared/BarChart.jsx";
import LineChart from "./shared/LineChart.jsx";
import DonutChart from "./shared/DonutChart.jsx";
import DataTable from "./shared/DataTable.jsx";
import "../../../../assets/styles/components/modules/gestionStocks/statsPertes.css";

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

const COLUMNS = [
    { key: "nom",         label: "Produit",         sortable: true,
      render: (v) => <span className="statsPertes-table__name">{v}</span> },
    { key: "categorie",   label: "Catégorie",        sortable: true },
    { key: "quantite",    label: "Qté perdue",       sortable: true, align: "right" },
    { key: "valeur",      label: "Valeur (FCFA)",    sortable: true, align: "right",
      render: (v) => <span className="statsPertes-table__valeur">{v?.toLocaleString("fr-FR")}</span> },
    { key: "nbIncidents", label: "Nb incidents",     sortable: true, align: "right" },
];

function StatsPertes() {
    const { data, loading, error, refresh } = useStatistiques("pertes");

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

    const totalValeur = data?.parMotif?.reduce((s, d) => s + d.valeur, 0) ?? 0;

    return (
        <div className="statsPertes-root">

            <div className="statsPertes-header">
                <h2 className="statsPertes-title">Pertes</h2>
                <p className="statsPertes-subtitle">Identification et analyse des sources de pertes</p>
            </div>

            <div className="statsPertes-kpis">
                {loading ? (
                    <StatCardSkeleton count={4} />
                ) : (
                    <>
                        <StatCard
                            icon={Banknote}       iconMod="error"
                            label="Valeur totale perdue"
                            rawValue={k.valeurTotale}
                            format={formatFCFA}
                            delay={0}
                        />
                        <StatCard
                            icon={AlertTriangle}  iconMod="warning"
                            label="Nombre de pertes"
                            rawValue={k.nbTotal}
                            description="incidents enregistrés"
                            delay={60}
                        />
                        <StatCard
                            icon={Package2}       iconMod="error"
                            label="Produit le plus touché"
                            value={k.produitPlusToucheNom}
                            description={`${k.produitPlusToucheQty} unités perdues`}
                            delay={120}
                        />
                        <StatCard
                            icon={Tag}            iconMod="warning"
                            label="Catégorie la plus touchée"
                            value={k.categoriePlusTouchee}
                            delay={180}
                        />
                    </>
                )}
            </div>

            <div className="statsPertes-charts">
                <ChartCard
                    title="Évolution mensuelle des pertes"
                    subtitle="Valeur et nombre d'incidents"
                    skeleton={loading}
                    delay={80}
                >
                    {data?.evolutionMensuelle && (
                        <LineChart
                            data={data.evolutionMensuelle}
                            xKey="mois"
                            lines={[
                                { key: "valeur", color: "var(--color-error)",   label: "Valeur (FCFA)" },
                                { key: "nb",     color: "var(--color-warning)", label: "Nb incidents"  },
                            ]}
                            height={180}
                        />
                    )}
                </ChartCard>

                <ChartCard
                    title="Répartition par motif"
                    subtitle="En valeur totale (FCFA)"
                    skeleton={loading}
                    delay={130}
                >
                    {data?.parMotif && (
                        <DonutChart
                            data={data.parMotif}
                            valueKey="valeur"
                            labelKey="motif"
                            colorKey="color"
                            centerLabel="pertes"
                            centerValue={data.parMotif.length}
                        />
                    )}
                </ChartCard>

                <ChartCard
                    title="Top produits perdus"
                    subtitle="Par quantité perdue"
                    skeleton={loading}
                    delay={180}
                >
                    {data?.tableau && (
                        <BarChart
                            data={data.tableau}
                            labelKey="nom"
                            valueKey="quantite"
                            color="var(--color-error)"
                            unit="unités"
                        />
                    )}
                </ChartCard>
            </div>

            {!loading && data?.tableau && (
                <ChartCard title="Détail des pertes par produit" subtitle="Triable par colonne" delay={240}>
                    <DataTable columns={COLUMNS} data={data.tableau} emptyText="Aucune perte enregistrée." />
                </ChartCard>
            )}
        </div>
    );
}

export default StatsPertes;
