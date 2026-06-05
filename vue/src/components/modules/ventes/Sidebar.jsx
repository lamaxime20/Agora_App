import { Link } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, CalendarClock, Users, BarChart3, X } from "lucide-react";
import {
    VENTES_DASHBOARD,
    VENTES_COMMANDES,
    VENTES_RESERVATIONS,
    VENTES_CLIENTS,
    VENTES_STATISTIQUES
} from "../../../services/ventes.js";

const navItems = [
    { label: VENTES_DASHBOARD,    href: "/application/vente",                 icon: <LayoutDashboard size={20} /> },
    { label: VENTES_COMMANDES,    href: "/application/vente/commandes",       icon: <ShoppingCart size={20} /> },
    { label: VENTES_RESERVATIONS, href: "/application/vente/reservations",    icon: <CalendarClock size={20} /> },
    { label: VENTES_CLIENTS,      href: "/application/vente/clients",         icon: <Users size={20} /> },
    { label: VENTES_STATISTIQUES, href: "/application/vente/statistiques",    icon: <BarChart3 size={20} /> },
];

function Sidebar({ onglet, isOpen, isCollapsed, onClose }) {
    return (
        <aside
            id="ventes-sidebar"
            className={`app-sidebar${isOpen ? " app-sidebar--open" : ""}${isCollapsed ? " app-sidebar--collapsed" : ""}`}
        >
            <div className="app-sidebar__header">
                {!isCollapsed && <h2 className="app-sidebar__title">Module Ventes</h2>}
                <button
                    className="app-sidebar__close"
                    onClick={onClose}
                    aria-label="Fermer la navigation"
                    type="button"
                >
                    <X size={20} aria-hidden="true" />
                </button>
            </div>

            <nav className="app-sidebar__nav" aria-label="Navigation du module Ventes">
                <ul className="app-sidebar__list">
                    {navItems.map(item => (
                        <li key={item.label}>
                            <Link
                                to={item.href}
                                className={`app-sidebar__link${onglet === item.label ? " app-sidebar__link--active" : ""}`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <span className="app-sidebar__link-icon" aria-hidden="true">
                                    {item.icon}
                                </span>
                                {!isCollapsed && (
                                    <span className="app-sidebar__link-label">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}

export default Sidebar;