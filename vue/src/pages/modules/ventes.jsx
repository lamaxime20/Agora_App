import {
    VENTES_DASHBOARD,
    VENTES_COMMANDES,
    VENTES_RESERVATIONS,
    VENTES_CLIENTS,
    VENTES_STATISTIQUES
} from "../../services/ventes.js";
import Navbar from "../../components/modules/ventes/navbar.jsx";
import Commandes from "../../components/modules/ventes/commandes.jsx";

const ongletContent = {
    [VENTES_DASHBOARD]:    <h1>Tableau de bord</h1>,
    [VENTES_COMMANDES]:    <Commandes />,
    [VENTES_RESERVATIONS]: <h1>Réservations</h1>,
    [VENTES_CLIENTS]:      <h1>Clients</h1>,
    [VENTES_STATISTIQUES]: <h1>Statistiques</h1>,
};

function Ventes({ onglet }) {
    return (
        <div>
            <Navbar onglet={onglet} />
            <main>
                {ongletContent[onglet] || <h1>Page non trouvée</h1>}
            </main>
        </div>
    );
}

export default Ventes;