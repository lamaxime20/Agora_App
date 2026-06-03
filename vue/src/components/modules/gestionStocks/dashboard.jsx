import { Package, AlertTriangle, CalendarCheck, TrendingDown } from "lucide-react";
import "../../../assets/styles/components/modules/gestionStocks/dashboard.css";

const kpis = [
    { icon: Package,       label: "Produits actifs",   value: "148",          color: "primary" },
    { icon: AlertTriangle, label: "Alertes stock",      value: "7",            color: "warning" },
    { icon: CalendarCheck, label: "Réservations",       value: "12",           color: "info"    },
    { icon: TrendingDown,  label: "Pertes ce mois",     value: "45 200 FCFA",  color: "error"   },
];

const alertes = [
    { id: 1, type: "rupture", nom: "Cahier grand format",     quantite: 0, unite: "pièce"      },
    { id: 2, type: "faible",  nom: "Stylo bille bleu",        quantite: 4, unite: "pièce"      },
    { id: 3, type: "faible",  nom: "Papier ramette A4",       quantite: 2, unite: "ramette"    },
    { id: 4, type: "rupture", nom: "Encre imprimante noire",  quantite: 0, unite: "cartouche"  },
];

const activite = [
    { id: 1, type: "entree", description: "Réception de 50 Cahiers grand format",     heure: "Il y a 23 min" },
    { id: 2, type: "sortie", description: "Sortie de 3 Stylos bille bleu",             heure: "Il y a 1h"     },
    { id: 3, type: "alerte", description: "Stock faible détecté : Papier ramette A4",  heure: "Il y a 2h"     },
    { id: 4, type: "entree", description: "Réapprovisionnement validé — 10 produits",  heure: "Il y a 3h"     },
    { id: 5, type: "sortie", description: "Réservation #R-0042 confirmée",             heure: "Il y a 4h"     },
];

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
    return (
        <div className="gestionStockDashboard-root">
            <header className="gestionStockDashboard-header">
                <div>
                    <h1 className="gestionStockDashboard-title">Tableau de bord</h1>
                    <p className="gestionStockDashboard-subtitle">Vue d'ensemble de votre stock en temps réel</p>
                </div>
            </header>

            <section className="gestionStockDashboard-kpis" aria-label="Indicateurs clés">
                {kpis.map((kpi, i) => (
                    <KpiCard key={i} {...kpi} />
                ))}
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
