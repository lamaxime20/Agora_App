import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    BarChart2,
    ArrowLeft,
    X,
} from "lucide-react";

import { RH_DASHBOARD, RH_EMPLOYEES, RH_STATISTICS } from "../../../services/rh.js";
import "../../../assets/styles/components/modules/ressourcesHumaines/rhLayout.css";

const NAV_ITEMS = [
    { id: RH_DASHBOARD,  label: "Dashboard",   href: "/application/ressources-humaines",             Icon: LayoutDashboard },
    { id: RH_EMPLOYEES,  label: "Employés",    href: "/application/ressources-humaines/employees",   Icon: Users           },
    { id: RH_STATISTICS, label: "Statistiques",href: "/application/ressources-humaines/statistics",  Icon: BarChart2       },
];

function RhSidebar({ onglet, isOpen, onClose }) {
    return (
        <>
            {isOpen && (
                <div
                    className="rhSidebar-overlay"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                id="rh-sidebar"
                className={`rhSidebar-root${isOpen ? " rhSidebar-root--open" : ""}`}
                aria-label="Navigation — Module Ressources Humaines"
            >
                <div className="rhSidebar-header">
                    <div className="rhSidebar-brand">
                        <span className="rhSidebar-brand__name">AGORA</span>
                        <span className="rhSidebar-brand__module">RH</span>
                    </div>
                    <button
                        className="rhSidebar-close"
                        onClick={onClose}
                        aria-label="Fermer la navigation"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <nav className="rhSidebar-nav" aria-label="Sections du module RH">
                    <ul className="rhSidebar-list">
                        {NAV_ITEMS.map(({ id, label, href, Icon }) => {
                            const isActive = onglet === id;
                            return (
                                <li key={href}>
                                    <Link
                                        to={href}
                                        className={`rhSidebar-link${isActive ? " rhSidebar-link--active" : ""}`}
                                        aria-current={isActive ? "page" : undefined}
                                        onClick={onClose}
                                    >
                                        <Icon size={18} className="rhSidebar-link__icon" aria-hidden="true" />
                                        <span>{label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="rhSidebar-footer">
                    <Link to="/application" className="rhSidebar-back" onClick={onClose}>
                        <ArrowLeft size={16} aria-hidden="true" />
                        <span>Tous les modules</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}

export default RhSidebar;
