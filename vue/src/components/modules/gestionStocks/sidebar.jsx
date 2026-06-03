import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    RefreshCcw,
    CalendarCheck,
    TrendingDown,
    BarChart2,
    X,
    ArrowLeft
} from "lucide-react";

import {
    GESTION_STOCK_DASHBOARD,
    GESTION_STOCK_PRODUITS,
    GESTION_STOCK_REAPPROVISIONNEMENT,
    GESTION_STOCK_RESERVATIONS,
    GESTION_STOCK_PERTES,
    GESTION_STOCK_STATISTIQUES
} from "../../../services/gestionStock.js";

import "../../../assets/styles/components/modules/gestionStocks/sidebar.css";

const navItems = [
    { href: "/application/stock",                    label: GESTION_STOCK_DASHBOARD,          icon: LayoutDashboard },
    { href: "/application/stock/produits",            label: GESTION_STOCK_PRODUITS,            icon: Package         },
    { href: "/application/stock/reapprovisionnement", label: GESTION_STOCK_REAPPROVISIONNEMENT, icon: RefreshCcw      },
    { href: "/application/stock/reservations",        label: GESTION_STOCK_RESERVATIONS,        icon: CalendarCheck   },
    { href: "/application/stock/pertes",              label: GESTION_STOCK_PERTES,              icon: TrendingDown    },
    { href: "/application/stock/statistiques",        label: GESTION_STOCK_STATISTIQUES,        icon: BarChart2       },
];

function Sidebar({ onglet, isOpen, isCollapsed, onClose }) {
    return (
        <aside
            id="gestionStock-sidebar"
            className={[
                "gestionStock-sidebar",
                isOpen      ? "gestionStock-sidebar--open"      : "",
                isCollapsed ? "gestionStock-sidebar--collapsed" : "",
            ].join(" ").trim()}
            aria-label="Navigation — Gestion de Stock"
        >
            <div className="gestionStock-sidebar__header">
                <div className="gestionStock-sidebar__brand" aria-hidden="true">
                    <span className="gestionStock-sidebar__brand-name">AGORA</span>
                    <span className="gestionStock-sidebar__brand-module">Stock</span>
                </div>

                <button
                    className="gestionStock-sidebar__close"
                    onClick={onClose}
                    aria-label="Fermer le menu"
                    type="button"
                >
                    <X size={20} aria-hidden="true" />
                </button>
            </div>

            <nav className="gestionStock-sidebar__nav" aria-label="Sections du module">
                <ul className="gestionStock-sidebar__list">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = onglet === item.label;

                        return (
                            <li key={item.href} className="gestionStock-sidebar__item">
                                <Link
                                    to={item.href}
                                    className={[
                                        "gestionStock-sidebar__link",
                                        isActive ? "gestionStock-sidebar__link--active" : "",
                                    ].join(" ").trim()}
                                    onClick={onClose}
                                    aria-current={isActive ? "page" : undefined}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon
                                        size={20}
                                        className="gestionStock-sidebar__link-icon"
                                        aria-hidden="true"
                                    />
                                    <span className="gestionStock-sidebar__link-label">
                                        {item.label}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="gestionStock-sidebar__footer">
                <Link
                    to="/application"
                    className="gestionStock-sidebar__back"
                    onClick={onClose}
                    title={isCollapsed ? "Retour aux modules" : undefined}
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span className="gestionStock-sidebar__back-label">Modules</span>
                </Link>
            </div>
        </aside>
    );
}

export default Sidebar;
