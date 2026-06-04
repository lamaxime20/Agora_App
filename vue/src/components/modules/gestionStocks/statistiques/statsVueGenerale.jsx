import { Package2, Tag, Banknote, AlertCircle, AlertTriangle, TrendingDown, RefreshCw } from "lucide-react";
import { useStatistiques, formatFCFA, formatCompact } from "../../../../services/useStatistiques.js";
import StatCard, { StatCardSkeleton } from "./shared/StatCard.jsx";
import LineChart from "./shared/LineChart.jsx";
import "../../../../assets/styles/components/modules/gestionStocks/statsVueGenerale.css";

/* ─── ChartCard enveloppe ─────────────────────────────────────────────────────── */

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

/* ─── Vue Générale ────────────────────────────────────────────────────────────── */

function StatsVueGenerale() {
    const { data, loading, error, refresh } = useStatistiques("vueGenerale");

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
        <div className="statsVG-root">

            {/* ─── En-tête ─────────────────────────────────────────── */}
            <div className="statsVG-header">
                <div>
                    <h2 className="statsVG-title">Vue Générale</h2>
                    <p className="statsVG-subtitle">Analyse globale de l'état du stock</p>
                </div>
            </div>

            {/* ─── KPIs ────────────────────────────────────────────── */}
            <div className="statsVG-kpis">
                {loading ? (
                    <StatCardSkeleton count={6} />
                ) : (
                    <>
                        <StatCard
                            icon={Package2}  iconMod="primary"
                            label="Produits total"
                            rawValue={k.totalProduits}
                            variation={k.variationProduits}
                            description="références actives"
                            delay={0}
                        />
                        <StatCard
                            icon={Tag}        iconMod="info"
                            label="Catégories"
                            rawValue={k.totalCategories}
                            variation={k.variationCategories}
                            delay={60}
                        />
                        <StatCard
                            icon={Banknote}   iconMod="success"
                            label="Valeur du stock"
                            rawValue={k.valeurTotaleStock}
                            format={formatFCFA}
                            variation={k.variationValeur}
                            description="valeur totale"
                            delay={120}
                        />
                        <StatCard
                            icon={AlertCircle} iconMod="error"
                            label="En rupture"
                            rawValue={k.totalProduitsRupture}
                            variation={k.variationRupture}
                            description="produits à 0"
                            delay={180}
                        />
                        <StatCard
                            icon={AlertTriangle} iconMod="warning"
                            label="Stock faible"
                            rawValue={k.totalProduitsFaible}
                            variation={k.variationFaible}
                            description="seuil d'alerte atteint"
                            delay={240}
                        />
                        <StatCard
                            icon={TrendingDown} iconMod="error"
                            label="Coût total pertes"
                            rawValue={k.coutTotalPertes}
                            format={formatFCFA}
                            variation={k.variationPertes}
                            description="ce mois"
                            delay={300}
                        />
                    </>
                )}
            </div>

            {/* ─── Graphiques ──────────────────────────────────────── */}
            <div className="statsVG-charts">
                <ChartCard
                    title="Évolution de la valeur du stock"
                    subtitle="6 derniers mois (FCFA)"
                    skeleton={loading}
                    delay={100}
                >
                    {data && (
                        <LineChart
                            data={data.evolutionValeurStock}
                            xKey="mois"
                            lines={[{ key: "valeur", color: "var(--color-primary)", label: "Valeur stock" }]}
                            height={180}
                        />
                    )}
                </ChartCard>

                <ChartCard
                    title="Évolution des pertes"
                    subtitle="Valeur totale des pertes (FCFA)"
                    skeleton={loading}
                    delay={160}
                >
                    {data && (
                        <LineChart
                            data={data.evolutionPertes}
                            xKey="mois"
                            lines={[{ key: "valeur", color: "var(--color-error)", label: "Valeur pertes" }]}
                            height={180}
                        />
                    )}
                </ChartCard>

                <ChartCard
                    title="Réapprovisionnements"
                    subtitle="Montants mensuels (FCFA)"
                    skeleton={loading}
                    delay={220}
                >
                    {data && (
                        <LineChart
                            data={data.evolutionReappro}
                            xKey="mois"
                            lines={[
                                { key: "montant", color: "var(--color-success)", label: "Montant" },
                                { key: "nb",      color: "var(--color-info)",    label: "Nb opérations" },
                            ]}
                            height={180}
                        />
                    )}
                </ChartCard>
            </div>
        </div>
    );
}

export default StatsVueGenerale;
