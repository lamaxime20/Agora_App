import { Link } from "react-router-dom";
import { LayoutDashboard, Users, BarChart2 } from "lucide-react";
import { RH_DASHBOARD, RH_EMPLOYEES, RH_STATISTICS } from "../../../services/rh.js";
import "../../../assets/styles/components/modules/ressourcesHumaines/rhBottomNav.css";

const NAV_ITEMS = [
    { id: RH_DASHBOARD,  label: "Dashboard",    href: "/application/ressources-humaines",            Icon: LayoutDashboard },
    { id: RH_EMPLOYEES,  label: "Employés",     href: "/application/ressources-humaines/employees",  Icon: Users           },
    { id: RH_STATISTICS, label: "Stats",        href: "/application/ressources-humaines/statistics", Icon: BarChart2       },
];

function RhBottomNav({ onglet }) {
    return (
        <nav
            className="rhBottomNav-root"
            aria-label="Navigation principale — Module RH"
            role="navigation"
        >
            {NAV_ITEMS.map(({ id, label, href, Icon }) => {
                const isActive = onglet === id;
                return (
                    <Link
                        key={href}
                        to={href}
                        className={`rhBottomNav-item${isActive ? " rhBottomNav-item--active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={label}
                    >
                        <span className="rhBottomNav-item__pill">
                            <Icon size={22} className="rhBottomNav-item__icon" aria-hidden="true" />
                        </span>
                        <span className="rhBottomNav-item__label">{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default RhBottomNav;
