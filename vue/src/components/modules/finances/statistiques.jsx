import { useState, lazy, Suspense } from "react";
import {
    LayoutDashboard, TrendingUp, ShoppingCart, CreditCard,
    RotateCcw, Users, Repeat, Truck, ArrowRightLeft, FileDown,
} from "lucide-react";
import "../../../assets/styles/components/modules/finances/statistiques.css";

const VueGenerale          = lazy(() => import("./statistiques/vueGenerale.jsx"));
const Tresorerie           = lazy(() => import("./statistiques/tresorerie.jsx"));
const Commandes            = lazy(() => import("./statistiques/commandes.jsx"));
const Depenses             = lazy(() => import("./statistiques/depenses.jsx"));
const Remboursements       = lazy(() => import("./statistiques/remboursements.jsx"));
const StatsSalaires        = lazy(() => import("./statistiques/salaires.jsx"));
const StatsAbonnements     = lazy(() => import("./statistiques/abonnements.jsx"));
const StatsReapprovisionnements = lazy(() => import("./statistiques/reapprovisionnements.jsx"));
const FluxFinanciers       = lazy(() => import("./statistiques/fluxFinanciers.jsx"));
const Rapports             = lazy(() => import("./statistiques/rapports.jsx"));

const TABS = [
    { key: "general",  label: "Vue générale",          icon: LayoutDashboard,    Component: VueGenerale },
    { key: "tresorerie", label: "Trésorerie",          icon: TrendingUp,         Component: Tresorerie },
    { key: "commandes",  label: "Commandes",           icon: ShoppingCart,       Component: Commandes },
    { key: "depenses",   label: "Dépenses",            icon: CreditCard,         Component: Depenses },
    { key: "remboursements", label: "Remboursements",  icon: RotateCcw,          Component: Remboursements },
    { key: "salaires",   label: "Salaires",            icon: Users,              Component: StatsSalaires },
    { key: "abonnements",label: "Abonnements",         icon: Repeat,             Component: StatsAbonnements },
    { key: "reappro",    label: "Réapprovisionnements",icon: Truck,              Component: StatsReapprovisionnements },
    { key: "flux",       label: "Flux financiers",     icon: ArrowRightLeft,     Component: FluxFinanciers },
    { key: "rapports",   label: "Rapports",            icon: FileDown,           Component: Rapports },
];

function TabSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", padding: "var(--space-4) 0" }}>
            <div className="finStats-kpis finStats-kpis--5col">
                {[1,2,3,4].map(i => (
                    <div key={i} className="finStats-kpi">
                        <div className="finStats-skeleton finStats-skeleton--sm" />
                        <div className="finStats-skeleton finStats-skeleton--md" style={{ marginTop: 6 }} />
                    </div>
                ))}
            </div>
            <div className="finStats-chart-wrap" style={{ height: 240 }}>
                <div className="finStats-skeleton" style={{ height: "100%", borderRadius: "var(--radius-lg)" }} />
            </div>
        </div>
    );
}

function Statistiques() {
    const [activeTab, setActiveTab] = useState("general");

    const current = TABS.find(t => t.key === activeTab);
    const { Component } = current;

    return (
        <section className="finStats-root" aria-label="Statistiques financières">
            <header className="finStats-header">
                <h1 className="finStats-header__title">Statistiques</h1>
            </header>

            {/* Tab navigation */}
            <nav className="finStats-tabs" aria-label="Onglets statistiques" role="tablist">
                <div className="finStats-tabs__scroll">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            className={`finStats-tab ${activeTab === key ? "finStats-tab--active" : ""}`}
                            onClick={() => setActiveTab(key)}
                            role="tab"
                            aria-selected={activeTab === key}
                            aria-controls={`finStats-panel-${key}`}
                            id={`finStats-tab-${key}`}
                            type="button"
                        >
                            <Icon size={15} className="finStats-tab__icon" aria-hidden="true" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Tab panel */}
            <div
                id={`finStats-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`finStats-tab-${activeTab}`}
            >
                <Suspense fallback={<TabSkeleton />}>
                    <Component />
                </Suspense>
            </div>
        </section>
    );
}

export default Statistiques;
