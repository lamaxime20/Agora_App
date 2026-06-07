import { Package, AlertTriangle, CalendarCheck, TrendingDown, RefreshCw, AlertCircle } from "lucide-react";
import { useStatistiques, formatFCFA } from "../../../services/useStatistiques.js";
import "../../../assets/styles/components/modules/gestionStocks/dashboard.css";

function KpiCard({ icon: Icon, label, value, color }) {
    return (
        <article className={`gestionStockDashboard-kpi app-card app-card--hoverable`}>
            <div className={`gestionStockDashboard-kpi__icon gestionStockDashboard-kpi__icon--${color}`}>
                <Icon size={22} aria-hidden="true" />
            </div>
            <div className="gestionStockDashboard-kpi__body">
                <span className="gestionStockDashboard-kpi__label">{label}</span>
                <span className="gestionStockDashboard-kpi__value">{value}</span>
            </div>
        </article>
    );
}

function Dashboard() {
    const { data, loading, error, refresh } = useStatistiques("vueGenerale");
    const k = data?.kpis ?? {};

    const kpis = [
        { icon: Package,       label: "Produits actifs",   value: k.totalProduits ?? 0,           color: "primary" },
        { icon: AlertTriangle, label: "Alertes stock",      value: k.totalProduitsFaible ?? 0,     color: "warning" },
        { icon: CalendarCheck, label: "Réservations",       value: k.totalProduitsRupture ?? 0,    color: "info"    },
        { icon: TrendingDown,  label: "Pertes ce mois",     value: formatFCFA(k.coutTotalPertes ?? 0), color: "error"   },
    ];

    const alertes = [
        { id: 1, type: "rupture", nom: "Ruptures détectées", quantite: k.totalProduitsRupture ?? 0, unite: "produit" },
        { id: 2, type: "faible",  nom: "Stock faible",       quantite: k.totalProduitsFaible ?? 0,   unite: "produit" },
    ];

    const activite = (data?.evolutionValeurStock ?? []).slice(-5).map((item, index) => ({
        id: index + 1,
        type: item.valeur >= 0 ? "entree" : "sortie",
        description: `Mouvement de stock du ${item.mois}`,
        heure: item.mois,
    }));

    if (error) {
        return (
            <div className="listeReappro-error" role="alert">
                <AlertCircle size={32} aria-hidden="true" />
                <p>{error}</p>
                <button className="app-button app-button--ghost app-button--sm" onClick={refresh} type="button">
                    <RefreshCw size={13} aria-hidden="true" />
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className="gestionStockDashboard-root">
            <header className="gestionStockDashboard-header">
                <div>
                    <h1 className="gestionStockDashboard-title">Tableau de bord</h1>
                    <p className="gestionStockDashboard-subtitle">Vue d'ensemble de votre stock en temps réel</p>
                </div>
            </header>

            <section className="gestionStockDashboard-kpis" aria-label="Indicateurs clés">
                {loading
                    ? [...Array(4)].map((_, i) => (
                        <article key={i} className="gestionStockDashboard-kpi app-card app-card--hoverable" aria-busy="true">
                            <div className="skeleton-line skeleton-line--lg" />
                        </article>
                    ))
                    : kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)
                }
            </section>

            <div className="gestionStockDashboard-grid">
                <section className="gestionStockDashboard-panel app-card" aria-label="Alertes stock">
                    <h2 className="gestionStockDashboard-panel__title">Alertes stock</h2>
                    <ul className="gestionStockDashboard-alerts">
                        {alertes.map(alert => (
                            <li key={alert.id} className="gestionStockDashboard-alert">
                                <span className={`gestionStockDashboard-alert__badge gestionStockDashboard-alert__badge--${alert.type}`}>
                                    {alert.type === "rupture" ? "Rupture" : "Faible"}
                                </span>
                            <span className="gestionStockDashboard-alert__name">{alert.nom}</span>
                            <span className="gestionStockDashboard-alert__qty">
                                    {alert.quantite} {alert.unite}
                            </span>
                        </li>
                    ))}
                    </ul>
                </section>

                <section className="gestionStockDashboard-panel app-card" aria-label="Activité récente">
                    <h2 className="gestionStockDashboard-panel__title">Activité récente</h2>
                    <ul className="gestionStockDashboard-activity">
                        {activite.map(item => (
                            <li key={item.id} className="gestionStockDashboard-activity__item">
                                <div
                                    className={`gestionStockDashboard-activity__dot gestionStockDashboard-activity__dot--${item.type}`}
                                    aria-hidden="true"
                                />
                                <div className="gestionStockDashboard-activity__body">
                                    <span className="gestionStockDashboard-activity__text">{item.description}</span>
                                    <span className="gestionStockDashboard-activity__time">{item.heure}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default Dashboard;
