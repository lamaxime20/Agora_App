import {
    VENTES_DASHBOARD,
    VENTES_COMMANDES,
    VENTES_RESERVATIONS,
    VENTES_CLIENTS,
    VENTES_STATISTIQUES
} from "../../services/ventes.js";
import Navbar from "../../components/modules/ventes/navbar.jsx";
import Commandes from "../../components/modules/ventes/commandes.jsx";
import Reservations from "../../components/modules/ventes/reservations.jsx";
import Clients from "../../components/modules/ventes/clients.jsx";
import Statistiques from "../../components/modules/ventes/statistiques.jsx";


const ongletContent = {
    [VENTES_DASHBOARD]:    <h1>Tableau de bord</h1>,
    [VENTES_COMMANDES]:    <Commandes />,
    [VENTES_RESERVATIONS]: <Reservations />,
    [VENTES_CLIENTS]:      <Clients />,
    [VENTES_STATISTIQUES]: <Statistiques />,
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