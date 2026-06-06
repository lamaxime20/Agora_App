import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    Receipt,
    TrendingDown,
    TrendingUp,
    BarChart2,
} from "lucide-react";

import {
    FINANCES_DASHBOARD,
    FINANCES_COMMANDES,
    FINANCES_DEPENSES,
    FINANCES_ENTREES,
    FINANCES_STATISTIQUES,
} from "../../../services/finances.js";

import "../../../assets/styles/components/modules/finances/financesBottomNav.css";

const NAV_ITEMS = [
    { id: FINANCES_DASHBOARD,    label: "Dashboard",   href: "/application/finances",          Icon: LayoutDashboard },
    { id: FINANCES_COMMANDES,    label: "Commandes",   href: "/application/finances/commandes", Icon: Receipt         },
    { id: FINANCES_DEPENSES,     label: "Dépenses",    href: "/application/finances/depenses",  Icon: TrendingDown    },
    { id: FINANCES_ENTREES,      label: "Entrées",     href: "/application/finances/entrees",   Icon: TrendingUp      },
    { id: FINANCES_STATISTIQUES, label: "Statistiques",href: "/application/finances/statistiques", Icon: BarChart2   },
];

function FinancesBottomNav({ onglet }) {
    return (
        <nav
            className="financesBottomNav-root"
            aria-label="Navigation principale — Module Finances"
            role="navigation"
        >
            {NAV_ITEMS.map(({ id, label, href, Icon }) => {
                const isActive = onglet === id;
                return (
                    <Link
                        key={href}
                        to={href}
                        className={`financesBottomNav-item${isActive ? " financesBottomNav-item--active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={label}
                    >
                        <span className="financesBottomNav-item__pill">
                            <Icon
                                size={22}
                                className="financesBottomNav-item__icon"
                                aria-hidden="true"
                            />
                        </span>
                        <span className="financesBottomNav-item__label">{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default FinancesBottomNav;
