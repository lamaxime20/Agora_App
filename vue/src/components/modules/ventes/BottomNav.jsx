import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingCart,
    CalendarClock,
    Users,
    BarChart3,
} from "lucide-react";

import {
    VENTES_DASHBOARD,
    VENTES_COMMANDES,
    VENTES_RESERVATIONS,
    VENTES_CLIENTS,
    VENTES_STATISTIQUES,
} from "../../../services/ventes.js";

import "../../../assets/styles/components/modules/ventes/bottomNav.css";

const NAV_ITEMS = [
    { label: VENTES_DASHBOARD,    href: "/application/vente",              Icon: LayoutDashboard },
    { label: VENTES_COMMANDES,    href: "/application/vente/commandes",    Icon: ShoppingCart    },
    { label: VENTES_RESERVATIONS, href: "/application/vente/reservations", Icon: CalendarClock   },
    { label: VENTES_CLIENTS,      href: "/application/vente/clients",      Icon: Users           },
    { label: VENTES_STATISTIQUES, href: "/application/vente/statistiques", Icon: BarChart3       },
];

function BottomNav({ onglet }) {
    return (
        <nav
            className="bottomNav-root"
            aria-label="Navigation principale — Module Ventes"
            role="navigation"
        >
            {NAV_ITEMS.map(({ label, href, Icon }) => {
                const isActive = onglet === label;
                return (
                    <Link
                        key={href}
                        to={href}
                        className={`bottomNav-item${isActive ? " bottomNav-item--active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={label}
                    >
                        <span className="bottomNav-item__pill">
                            <Icon
                                size={22}
                                className="bottomNav-item__icon"
                                aria-hidden="true"
                            />
                        </span>
                        <span className="bottomNav-item__label">{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default BottomNav;
