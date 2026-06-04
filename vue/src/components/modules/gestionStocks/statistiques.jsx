import { useState, lazy, Suspense } from "react";
import { LayoutDashboard, Package2, Warehouse, RefreshCw, AlertTriangle } from "lucide-react";
import "../../../assets/styles/components/modules/gestionStocks/statistiques.css";

/* ─── Lazy loading des pages ─────────────────────────────────────────────────── */

const StatsVueGenerale          = lazy(() => import("./statistiques/statsVueGenerale.jsx"));
const StatsProduits             = lazy(() => import("./statistiques/statsProduits.jsx"));
const StatsStock                = lazy(() => import("./statistiques/statsStock.jsx"));
const StatsReapprovisionnements = lazy(() => import("./statistiques/statsReapprovisionnements.jsx"));
const StatsPertes               = lazy(() => import("./statistiques/statsPertes.jsx"));

/* ─── Définition des onglets ─────────────────────────────────────────────────── */

const ONGLETS = [
    { id: "vueGenerale",          label: "Vue Générale",         Icon: LayoutDashboard },
    { id: "produits",             label: "Produits",             Icon: Package2        },
    { id: "stock",                label: "Stock",                Icon: Warehouse       },
    { id: "reapprovisionnements", label: "Réapprovisionnements", Icon: RefreshCw       },
    { id: "pertes",               label: "Pertes",               Icon: AlertTriangle   },
];

const PAGES = {
    vueGenerale:          <StatsVueGenerale />,
    produits:             <StatsProduits />,
    stock:                <StatsStock />,
    reapprovisionnements: <StatsReapprovisionnements />,
    pertes:               <StatsPertes />,
};

/* ─── Skeleton de page ────────────────────────────────────────────────────────── */

function PageSkeleton() {
    return (
        <div className="statistiques-page-skeleton" aria-busy="true">
            <div className="statistiques-page-skeleton__header" />
            <div className="statistiques-page-skeleton__kpis">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="statistiques-page-skeleton__kpi" />
                ))}
            </div>
            <div className="statistiques-page-skeleton__charts">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="statistiques-page-skeleton__chart" />
                ))}
            </div>
        </div>
    );
}

/* ─── Composant principal ─────────────────────────────────────────────────────── */

function Statistiques() {
    const [ongletActif, setOngletActif] = useState("vueGenerale");

    return (
        <div className="statistiques-root">
            {/* ─── Navigation onglets ─────────────────────────── */}
            <nav
                className="statistiques-nav"
                role="tablist"
                aria-label="Pages de statistiques"
            >
                <div className="statistiques-nav__scroll">
                    {ONGLETS.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={ongletActif === id}
                            className={`statistiques-tab${ongletActif === id ? " statistiques-tab--active" : ""}`}
                            onClick={() => setOngletActif(id)}
                            type="button"
                        >
                            <Icon size={15} aria-hidden="true" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* ─── Contenu page active ────────────────────────── */}
            <div className="statistiques-content" role="tabpanel">
                <Suspense fallback={<PageSkeleton />}>
                    {PAGES[ongletActif]}
                </Suspense>
            </div>
        </div>
    );
}

export default Statistiques;
