import { RefreshCw, Banknote, Users, Clock, AlertCircle } from "lucide-react";
import { useStatistiques, formatFCFA } from "../../../../services/useStatistiques.js";
import StatCard, { StatCardSkeleton } from "./shared/StatCard.jsx";
import BarChart from "./shared/BarChart.jsx";
import LineChart from "./shared/LineChart.jsx";
import DataTable from "./shared/DataTable.jsx";
import "../../../../assets/styles/components/modules/gestionStocks/statsReappro.css";

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
    { key: "nom",      label: "Produit",         sortable: true,
      render: (v) => <span className="statsReappro-table__name">{v}</span> },
    { key: "quantite", label: "Quantité totale",  sortable: true, align: "right" },
    { key: "montant",  label: "Montant (FCFA)",   sortable: true, align: "right",
      render: (v) => <span className="statsReappro-table__montant">{v?.toLocaleString("fr-FR")}</span> },
    { key: "nb",       label: "Nb opérations",    sortable: true, align: "right" },
];

function StatsReapprovisionnements() {
    const { data, loading, error, refresh } = useStatistiques("reapprovisionnements");

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
        <div className="statsReappro-root">

            <div className="statsReappro-header">
                <h2 className="statsReappro-title">Réapprovisionnements</h2>
                <p className="statsReappro-subtitle">Efficacité et volumes de réapprovisionnement</p>
            </div>

            <div className="statsReappro-kpis">
                {loading ? (
                    <StatCardSkeleton count={4} />
                ) : (
                    <>
                        <StatCard
                            icon={RefreshCw}  iconMod="primary"
                            label="Opérations total"
                            rawValue={k.totalNb}
                            description="depuis le début"
                            delay={0}
                        />
                        <StatCard
                            icon={Banknote}   iconMod="success"
                            label="Montant total"
                            rawValue={k.montantTotal}
                            format={formatFCFA}
                            delay={60}
                        />
                        <StatCard
                            icon={Clock}      iconMod="info"
                            label="Respect délais"
                            value={`${k.tauxRespectDelais} %`}
                            description="livraisons dans les délais"
                            delay={120}
                        />
                        <StatCard
                            icon={Users}      iconMod="accent"
                            label="Fournisseurs actifs"
                            rawValue={k.nbFournisseurs}
                            delay={180}
                        />
                    </>
                )}
            </div>

            <div className="statsReappro-charts">
                <ChartCard
                    title="Montants mensuels"
                    subtitle="Évolution des dépenses de réapprovisionnement (FCFA)"
                    skeleton={loading}
                    delay={80}
                >
                    {data?.parPeriode && (
                        <LineChart
                            data={data.parPeriode}
                            xKey="mois"
                            lines={[
                                { key: "montant", color: "var(--color-primary)", label: "Montant (FCFA)" },
                            ]}
                            height={180}
                        />
                    )}
                </ChartCard>

                <ChartCard
                    title="Top fournisseurs"
                    subtitle="Par montant total commandé"
                    skeleton={loading}
                    delay={140}
                >
                    {data?.topFournisseurs && (
                        <BarChart
                            data={data.topFournisseurs}
                            labelKey="nom"
                            valueKey="montant"
                            color="var(--color-success)"
                            formatVal={(v) => v?.toLocaleString("fr-FR") + " FCFA"}
                        />
                    )}
                </ChartCard>
            </div>

            {!loading && data?.tableau && (
                <ChartCard title="Produits réapprovisionnés" subtitle="Triable par colonne" delay={200}>
                    <DataTable columns={COLUMNS} data={data.tableau} emptyText="Aucun réapprovisionnement." />
                </ChartCard>
            )}
        </div>
    );
}

export default StatsReapprovisionnements;
