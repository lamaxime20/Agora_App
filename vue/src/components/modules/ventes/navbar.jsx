import { Link } from "react-router-dom";
import {
    VENTES_DASHBOARD,
    VENTES_COMMANDES,
    VENTES_RESERVATIONS,
    VENTES_CLIENTS,
    VENTES_STATISTIQUES
} from "../../../services/ventes.js";

const navItems = [
    { label: VENTES_DASHBOARD,    href: "/application/vente" },
    { label: VENTES_COMMANDES,    href: "/application/vente/commandes" },
    { label: VENTES_RESERVATIONS, href: "/application/vente/reservations" },
    { label: VENTES_CLIENTS,      href: "/application/vente/clients" },
    { label: VENTES_STATISTIQUES, href: "/application/vente/statistiques" },
];

function Navbar({ onglet }) {
    return (
        <nav>
            <h2>Module Ventes</h2>
            {navItems.map(item => <div key={item.label}><Link to={item.href}>{item.label}</Link></div>)}
        </nav>
    );
}

export default Navbar;