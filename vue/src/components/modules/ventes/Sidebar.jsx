import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingCart,
    CalendarClock,
    Users,
    BarChart3,
    X,
    ArrowLeft,
} from "lucide-react";

import {
    VENTES_DASHBOARD,
    VENTES_COMMANDES,
    VENTES_RESERVATIONS,
    VENTES_CLIENTS,
    VENTES_STATISTIQUES,
} from "../../../services/ventes.js";

import "../../../assets/styles/components/modules/ventes/ventesLayout.css";

const navItems = [
    { label: VENTES_DASHBOARD,    href: "/application/vente",              Icon: LayoutDashboard },
    { label: VENTES_COMMANDES,    href: "/application/vente/commandes",    Icon: ShoppingCart    },
    { label: VENTES_RESERVATIONS, href: "/application/vente/reservations", Icon: CalendarClock   },
    { label: VENTES_CLIENTS,      href: "/application/vente/clients",      Icon: Users           },
    { label: VENTES_STATISTIQUES, href: "/application/vente/statistiques", Icon: BarChart3       },
];

function Sidebar({ onglet, isOpen, onClose }) {
    return (
        <aside
            id="ventes-sidebar"
            className={`ventesSidebar-root${isOpen ? " ventesSidebar-root--open" : ""}`}
            aria-label="Navigation — Module Ventes"
        >
            <div className="ventesSidebar-header">
                <div className="ventesSidebar-brand">
                    <span className="ventesSidebar-brand__name">AGORA</span>
                    <span className="ventesSidebar-brand__module">Ventes</span>
                </div>

                <button
                    className="ventesSidebar-close"
                    onClick={onClose}
                    aria-label="Fermer la navigation"
                    type="button"
                >
                    <X size={20} aria-hidden="true" />
                </button>
            </div>

            <nav className="ventesSidebar-nav" aria-label="Sections du module Ventes">
                <ul className="ventesSidebar-list">
                    {navItems.map(({ label, href, Icon }) => {
                        const isActive = onglet === label;
                        return (
                            <li key={href} className="ventesSidebar-item">
                                <Link
                                    to={href}
                                    className={`ventesSidebar-link${isActive ? " ventesSidebar-link--active" : ""}`}
                                    onClick={onClose}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <Icon
                                        size={20}
                                        className="ventesSidebar-link__icon"
                                        aria-hidden="true"
                                    />
                                    <span>{label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="ventesSidebar-footer">
                <Link
                    to="/application"
                    className="ventesSidebar-back"
                    onClick={onClose}
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span className="ventesSidebar-back__label">Tous les modules</span>
                </Link>
            </div>
        </aside>
    );
}

export default Sidebar;
