import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    PackageCheck,
    Truck,
    BarChart3,
    ArrowLeft,
} from "lucide-react";

import {
    LIVRAISON_DASHBOARD,
    LIVRAISON_COMMANDES,
    LIVRAISON_MES_LIVRAISONS,
    LIVRAISON_STATISTIQUES,
} from "../../../services/livraison.js";

import "../../../assets/styles/components/modules/livraison/livraisonLayout.css";

const NAV_ITEMS = [
    { label: LIVRAISON_DASHBOARD,      href: "/application/livraison",               Icon: LayoutDashboard },
    { label: LIVRAISON_COMMANDES,      href: "/application/livraison/commandes",      Icon: PackageCheck    },
    { label: LIVRAISON_MES_LIVRAISONS, href: "/application/livraison/mes-livraisons", Icon: Truck           },
    { label: LIVRAISON_STATISTIQUES,   href: "/application/livraison/statistiques",   Icon: BarChart3       },
];

function Sidebar({ onglet }) {
    return (
        <aside
            id="livraison-sidebar"
            className="livraisonSidebar-root"
            aria-label="Navigation — Module Livraison"
        >
            <div className="livraisonSidebar-header">
                <div className="livraisonSidebar-brand">
                    <span className="livraisonSidebar-brand__name">AGORA</span>
                    <span className="livraisonSidebar-brand__module">Livraison</span>
                </div>
            </div>

            <nav className="livraisonSidebar-nav" aria-label="Sections du module Livraison">
                <ul className="livraisonSidebar-list">
                    {NAV_ITEMS.map(({ label, href, Icon }) => {
                        const isActive = onglet === label;
                        return (
                            <li key={href} className="livraisonSidebar-item">
                                <Link
                                    to={href}
                                    className={`livraisonSidebar-link${isActive ? " livraisonSidebar-link--active" : ""}`}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <Icon size={20} className="livraisonSidebar-link__icon" aria-hidden="true" />
                                    <span>{label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="livraisonSidebar-footer">
                <Link to="/application" className="livraisonSidebar-back">
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span className="livraisonSidebar-back__label">Tous les modules</span>
                </Link>
            </div>
        </aside>
    );
}

export default Sidebar;
