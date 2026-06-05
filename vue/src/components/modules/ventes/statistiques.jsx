import { useState } from "react";
import { BarChart3, X, Download, TrendingUp } from "lucide-react";
import { formatMontant } from "../../../services/ventes.js";
import "../../../assets/styles/components/modules/ventes/statistiques.css";

const INITIAL_PERFORMANCE = [
    { id: 1, nom: "Produit Alpha", quantite_vendue: 58, prix_unitaire: 150, reduction_appliquee: 870,  categories: "Électronique" },
    { id: 2, nom: "Produit Beta",  quantite_vendue: 34, prix_unitaire: 80,  reduction_appliquee: 0,    categories: "Accessoires"  },
    { id: 3, nom: "Produit Gamma", quantite_vendue: 22, prix_unitaire: 200, reduction_appliquee: 1100, categories: "Électronique" },
];

function Statistiques() {
    const [performanceData]                         = useState(INITIAL_PERFORMANCE);
    const [startDate, setStartDate]                 = useState("2026-01-01");
    const [endDate,   setEndDate]                   = useState("2026-06-30");
    const [categoryFilter, setCategoryFilter]       = useState("toutes");
    const [selectedProduct, setSelectedProduct]     = useState(null);

    const calcRevenue = (item) =>
        item.quantite_vendue * item.prix_unitaire - item.reduction_appliquee;

    const filteredPerformance = performanceData.filter(
        (item) => categoryFilter === "toutes" || item.categories === categoryFilter
    );

    const totalRevenue      = filteredPerformance.reduce((acc, i) => acc + calcRevenue(i), 0);
    const totalUnitsSold    = filteredPerformance.reduce((acc, i) => acc + i.quantite_vendue, 0);
    const avgRevenueProduct = filteredPerformance.length > 0
        ? totalRevenue / filteredPerformance.length
        : 0;

    const kpis = [
        {
            label: "Chiffre d'affaires net",
            value: formatMontant(totalRevenue),
            desc: "Cumul après déduction des remises commerciales",
            icon: TrendingUp,
            variant: "primary",
        },
        {
            label: "Volume de distribution",
            value: `${totalUnitsSold} unités`,
            desc: "Nombre total d'articles écoulés sur la période",
            icon: BarChart3,
            variant: "info",
        },
        {
            label: "Rendement moyen par référence",
            value: formatMontant(avgRevenueProduct),
            desc: "CA divisé par le nombre de lignes catalogue",
            icon: BarChart3,
            variant: "success",
        },
    ];

    return (
        <section className="statistiques-root" aria-label="Statistiques commerciales">

            {/* Header */}
            <header className="statistiques-header">
                <div className="statistiques-header__left">
                    <h1 className="statistiques-header__title">Statistiques</h1>
                    <p className="statistiques-header__subtitle">
                        Analyse décisionnelle des flux financiers et des volumes d'écoulement.
                    </p>
                </div>
            </header>

            {/* Filtres */}
            <div className="statistiques-filters" role="search" aria-label="Filtres analytiques">
                <div className="statistiques-filters__group">
                    <label className="statistiques-filters__label" htmlFor="stat-start">Période du</label>
                    <input
                        id="stat-start"
                        type="date"
                        className="app-input statistiques-filters__date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="statistiques-filters__group">
                    <label className="statistiques-filters__label" htmlFor="stat-end">Au</label>
                    <input
                        id="stat-end"
                        type="date"
                        className="app-input statistiques-filters__date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="statistiques-filters__group">
                    <label className="statistiques-filters__label" htmlFor="stat-cat">Catégorie</label>
                    <select
                        id="stat-cat"
                        className="statistiques-filters__select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="toutes">Toutes les catégories</option>
                        <option value="Électronique">Électronique</option>
                        <option value="Accessoires">Accessoires</option>
                    </select>
                </div>
                <div className="statistiques-filters__export">
                    <button
                        className="app-button app-button--ghost app-button--sm"
                        onClick={() => alert(`Export CSV — ${filteredPerformance.length} segments`)}
                        type="button"
                    >
                        <Download size={16} aria-hidden="true" />
                        CSV
                    </button>
                    <button
                        className="app-button app-button--ghost app-button--sm"
                        onClick={() => alert(`Rapport PDF — ${filteredPerformance.length} segments`)}
                        type="button"
                    >
                        <Download size={16} aria-hidden="true" />
                        PDF
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="statistiques-kpis" role="region" aria-label="Indicateurs clés">
                {kpis.map(({ label, value, desc, icon: Icon, variant }) => (
                    <div key={label} className={`statistiques-kpi statistiques-kpi--${variant}`}>
                        <div className="statistiques-kpi__icon">
                            <Icon size={20} aria-hidden="true" />
                        </div>
                        <div className="statistiques-kpi__body">
                            <span className="statistiques-kpi__value">{value}</span>
                            <span className="statistiques-kpi__label">{label}</span>
                            <span className="statistiques-kpi__desc">{desc}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tableau de performance */}
            <div className="statistiques-section">
                <h2 className="statistiques-section__title">Classement des ventes par produit</h2>

                {filteredPerformance.length === 0 ? (
                    <div className="statistiques-empty" role="status">
                        <div className="statistiques-empty__icon" aria-hidden="true">
                            <BarChart3 size={36} />
                        </div>
                        <h3 className="statistiques-empty__title">Aucune donnée pour cette période</h3>
                        <p className="statistiques-empty__desc">Modifiez les filtres pour afficher les résultats.</p>
                    </div>
                ) : (
                    <div className="statistiques-tableWrap" role="region" aria-label="Performance des produits">
                        <table className="statistiques-table" aria-label="Performance par produit">
                            <thead className="statistiques-table__head">
                                <tr>
                                    <th scope="col">Code</th>
                                    <th scope="col">Désignation</th>
                                    <th scope="col">Famille</th>
                                    <th scope="col">Unités vendues</th>
                                    <th scope="col">Remises accordées</th>
                                    <th scope="col" style={{ textAlign: "right" }}>CA généré</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPerformance.map((product) => {
                                    const rev = calcRevenue(product);
                                    return (
                                        <tr
                                            key={product.id}
                                            className="statistiques-table__row"
                                            onClick={() => setSelectedProduct(product)}
                                        >
                                            <td className="statistiques-table__id">#{product.id}</td>
                                            <td className="statistiques-table__nom">{product.nom}</td>
                                            <td className="statistiques-table__cat">{product.categories}</td>
                                            <td className="statistiques-table__qty">{product.quantite_vendue}</td>
                                            <td className="statistiques-table__reduction">
                                                {formatMontant(product.reduction_appliquee)}
                                            </td>
                                            <td className="statistiques-table__revenue">
                                                {formatMontant(rev)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Drawer analyse produit ── */}
            {selectedProduct && (() => {
                const revenue = calcRevenue(selectedProduct);
                const brutTheorique = selectedProduct.quantite_vendue * selectedProduct.prix_unitaire;
                return (
                    <>
                        <div
                            className="statistiques-drawer__overlay"
                            onClick={() => setSelectedProduct(null)}
                            aria-hidden="true"
                        />
                        <aside className="statistiques-drawer" aria-label={`Analyse ${selectedProduct.nom}`}>
                            <div className="statistiques-drawer__handle" aria-hidden="true">
                                <span className="statistiques-drawer__handle-bar" />
                            </div>
                            <div className="statistiques-drawer__header">
                                <h2 className="statistiques-drawer__title">{selectedProduct.nom}</h2>
                                <button
                                    className="statistiques-drawer__close"
                                    onClick={() => setSelectedProduct(null)}
                                    aria-label="Fermer"
                                    type="button"
                                >
                                    <X size={18} aria-hidden="true" />
                                </button>
                            </div>

                            <div className="statistiques-drawer__body">
                                {/* Métriques 2×2 */}
                                <div className="statistiques-analysis__grid">
                                    {[
                                        { label: "Segment de marché",         value: selectedProduct.categories },
                                        { label: "Prix unitaire catalogue",   value: formatMontant(selectedProduct.prix_unitaire) },
                                        { label: "Volume brut écoulé",        value: `${selectedProduct.quantite_vendue} unités` },
                                        { label: "Rendement brut théorique",  value: formatMontant(brutTheorique) },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="statistiques-analysis__metric">
                                            <span className="statistiques-analysis__metric-label">{label}</span>
                                            <span className="statistiques-analysis__metric-value">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Synthèse financière */}
                                <div className="statistiques-analysis__block">
                                    <span className="statistiques-analysis__block-label">Synthèse financière</span>
                                    <div className="statistiques-analysis__row">
                                        <span className="statistiques-analysis__key">Remises / promotions</span>
                                        <span className="statistiques-analysis__val statistiques-analysis__val--negative">
                                            − {formatMontant(selectedProduct.reduction_appliquee)}
                                        </span>
                                    </div>
                                    <div className="statistiques-analysis__row statistiques-analysis__row--total">
                                        <span className="statistiques-analysis__key">Apport net au CA</span>
                                        <span className="statistiques-analysis__val statistiques-analysis__val--positive">
                                            {formatMontant(revenue)}
                                        </span>
                                    </div>
                                </div>

                                {/* Répartition trimestrielle */}
                                <div className="statistiques-analysis__block">
                                    <span className="statistiques-analysis__block-label">
                                        Répartition trimestrielle (simulation)
                                    </span>
                                    <table className="statistiques-quarterly__table">
                                        <thead>
                                            <tr>
                                                <th>Période</th>
                                                <th>Volume estimé</th>
                                                <th style={{ textAlign: "right" }}>CA estimé</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Trimestre 1 (Q1)</td>
                                                <td>{Math.floor(selectedProduct.quantite_vendue * 0.4)} unités</td>
                                                <td style={{ textAlign: "right" }}>{formatMontant(revenue * 0.4)}</td>
                                            </tr>
                                            <tr>
                                                <td>Trimestre 2 (Q2)</td>
                                                <td>{Math.ceil(selectedProduct.quantite_vendue * 0.6)} unités</td>
                                                <td style={{ textAlign: "right" }}>{formatMontant(revenue * 0.6)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </aside>
                    </>
                );
            })()}
        </section>
    );
}

export default Statistiques;
