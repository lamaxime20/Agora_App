import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    Receipt,
    RotateCcw,
    TrendingDown,
    TrendingUp,
    Repeat,
    Truck,
    Users,
    BarChart2,
    ArrowLeft,
    X,
} from "lucide-react";

import {
    FINANCES_DASHBOARD,
    FINANCES_COMMANDES,
    FINANCES_REMBOURSEMENTS,
    FINANCES_DEPENSES,
    FINANCES_ENTREES,
    FINANCES_ABONNEMENTS,
    FINANCES_REAPPROVISIONNEMENTS,
    FINANCES_SALAIRES,
    FINANCES_STATISTIQUES,
} from "../../../services/finances.js";

import "../../../assets/styles/components/modules/finances/financesLayout.css";

const NAV_ITEMS = [
    { id: FINANCES_DASHBOARD,          label: "Dashboard",             href: "/application/finances",                      Icon: LayoutDashboard },
    { id: FINANCES_COMMANDES,          label: "Commandes",             href: "/application/finances/commandes",            Icon: Receipt         },
    { id: FINANCES_REMBOURSEMENTS,     label: "Remboursements",        href: "/application/finances/remboursements",       Icon: RotateCcw       },
    { id: FINANCES_DEPENSES,           label: "Dépenses",              href: "/application/finances/depenses",             Icon: TrendingDown    },
    { id: FINANCES_ENTREES,            label: "Entrées",               href: "/application/finances/entrees",              Icon: TrendingUp      },
    { id: FINANCES_ABONNEMENTS,        label: "Abonnements",           href: "/application/finances/abonnements",          Icon: Repeat          },
    { id: FINANCES_REAPPROVISIONNEMENTS, label: "Réapprovisionnements", href: "/application/finances/reapprovisionnements", Icon: Truck           },
    { id: FINANCES_SALAIRES,           label: "Salaires",              href: "/application/finances/salaires",             Icon: Users           },
    { id: FINANCES_STATISTIQUES,       label: "Statistiques",          href: "/application/finances/statistiques",         Icon: BarChart2       },
];

function Sidebar({ onglet, isOpen, onClose }) {
    return (
        <>
            {isOpen && (
                <div
                    className="financesSidebar-overlay"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                id="finances-sidebar"
                className={`financesSidebar-root${isOpen ? " financesSidebar-root--open" : ""}`}
                aria-label="Navigation — Module Finances"
            >
                {/* Logo / Branding */}
                <div className="financesSidebar-header">
                    <div className="financesSidebar-brand">
                        <span className="financesSidebar-brand__name">AGORA</span>
                        <span className="financesSidebar-brand__module">Finance</span>
                    </div>
                    <button
                        className="financesSidebar-close"
                        onClick={onClose}
                        aria-label="Fermer la navigation"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="financesSidebar-nav" aria-label="Sections du module Finance">
                    <ul className="financesSidebar-list">
                        {NAV_ITEMS.map(({ id, label, href, Icon }) => {
                            const isActive = onglet === id;
                            return (
                                <li key={href} className="financesSidebar-item">
                                    <Link
                                        to={href}
                                        className={`financesSidebar-link${isActive ? " financesSidebar-link--active" : ""}`}
                                        aria-current={isActive ? "page" : undefined}
                                        onClick={onClose}
                                    >
                                        <Icon
                                            size={18}
                                            className="financesSidebar-link__icon"
                                            aria-hidden="true"
                                        />
                                        <span>{label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Retour modules */}
                <div className="financesSidebar-footer">
                    <Link to="/application" className="financesSidebar-back" onClick={onClose}>
                        <ArrowLeft size={16} aria-hidden="true" />
                        <span className="financesSidebar-back__label">Tous les modules</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
