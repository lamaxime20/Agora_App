import { Link } from "react-router-dom";
import {
    GESTION_STOCK_DASHBOARD,
    GESTION_STOCK_PRODUITS,
    GESTION_STOCK_REAPPROVISIONNEMENT,
    GESTION_STOCK_RESERVATIONS,
    GESTION_STOCK_PERTES,
    GESTION_STOCK_STATISTIQUES
} from "../../../services/gestionStock.js";

const navLinks = [
    { href: "/application/stock", label: GESTION_STOCK_DASHBOARD },
    { href: "/application/stock/produits", label: GESTION_STOCK_PRODUITS },
    { href: "/application/stock/reapprovisionnement", label: GESTION_STOCK_REAPPROVISIONNEMENT },
    { href: "/application/stock/reservations", label: GESTION_STOCK_RESERVATIONS },
    { href: "/application/stock/pertes", label: GESTION_STOCK_PERTES },
    { href: "/application/stock/statistiques", label: GESTION_STOCK_STATISTIQUES },
];

function Navbar({ onglet }) {
    return (
        <nav className="navbar_gestionStock-root">
            <ul className="navbar_gestionStock-list">
                {navLinks.map((link) => (
                    <li
                        key={link.href}
                        className={`navbar_gestionStock-item ${onglet === link.label ? 'navbar_gestionStock-item-active' : ''}`}
                    >
                        <Link to={link.href}>{link.label}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}

export default Navbar;