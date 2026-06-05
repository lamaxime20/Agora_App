import { Link } from "react-router-dom";
import {
    FINANCES_DASHBOARD,
    FINANCES_COMMANDES,
    FINANCES_REMBOURSEMENTS,
    FINANCES_DEPENSES,
    FINANCES_ENTREES,
    FINANCES_ABONNEMENTS,
    FINANCES_REAPPROVISIONNEMENTS,
    FINANCES_SALAIRES,
    FINANCES_STATISTIQUES
} from "../../../services/finances.js";

function Navbar({ onglet }) {
    const navItems = [
        { id: FINANCES_DASHBOARD, label: "Dashboard", path: "/application/finances" },
        { id: FINANCES_COMMANDES, label: "Commandes", path: "/application/finances/commandes" },
        { id: FINANCES_REMBOURSEMENTS, label: "Remboursements", path: "/application/finances/remboursements" },
        { id: FINANCES_DEPENSES, label: "Dépenses", path: "/application/finances/depenses" },
        { id: FINANCES_ENTREES, label: "Entrées", path: "/application/finances/entrees" },
        { id: FINANCES_ABONNEMENTS, label: "Abonnements", path: "/application/finances/abonnements" },
        { id: FINANCES_REAPPROVISIONNEMENTS, label: "Réapprovisionnements", path: "/application/finances/reapprovisionnements" },
        { id: FINANCES_SALAIRES, label: "Salaires", path: "/application/finances/salaires" },
        { id: FINANCES_STATISTIQUES, label: "Statistiques", path: "/application/finances/statistiques" },
    ];

    return (
        <nav>
            <ul>
                {navItems.map(item => (
                    <li key={item.id} style={{ fontWeight: onglet === item.id ? 'bold' : 'normal' }}>
                        <Link to={item.path}>{item.label}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default Navbar;