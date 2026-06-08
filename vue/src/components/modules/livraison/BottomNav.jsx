import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    PackageCheck,
    Truck,
    BarChart3,
} from "lucide-react";

import {
    LIVRAISON_DASHBOARD,
    LIVRAISON_COMMANDES,
    LIVRAISON_MES_LIVRAISONS,
    LIVRAISON_STATISTIQUES,
} from "../../../services/livraison.js";

import "../../../assets/styles/components/modules/livraison/livraisonBottomNav.css";

const NAV_ITEMS = [
    { label: LIVRAISON_DASHBOARD,      href: "/application/livraison",               Icon: LayoutDashboard, shortLabel: "Dashboard" },
    { label: LIVRAISON_COMMANDES,      href: "/application/livraison/commandes",      Icon: PackageCheck,    shortLabel: "Commandes" },
    { label: LIVRAISON_MES_LIVRAISONS, href: "/application/livraison/mes-livraisons", Icon: Truck,           shortLabel: "Mes livraisons" },
    { label: LIVRAISON_STATISTIQUES,   href: "/application/livraison/statistiques",   Icon: BarChart3,       shortLabel: "Statistiques" },
];

function BottomNav({ onglet }) {
    return (
        <nav
            className="livraisonBottomNav-root"
            aria-label="Navigation principale — Module Livraison"
            role="navigation"
        >
            {NAV_ITEMS.map(({ label, href, Icon, shortLabel }) => {
                const isActive = onglet === label;
                return (
                    <Link
                        key={href}
                        to={href}
                        className={`livraisonBottomNav-item${isActive ? " livraisonBottomNav-item--active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={label}
                    >
                        <span className="livraisonBottomNav-item__pill">
                            <Icon size={22} className="livraisonBottomNav-item__icon" aria-hidden="true" />
                        </span>
                        <span className="livraisonBottomNav-item__label">{shortLabel}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default BottomNav;
