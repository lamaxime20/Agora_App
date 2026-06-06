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
} from "../../services/finances.js";
import Navbar from "../../components/modules/finances/navbar.jsx";
import Commandes from "../../components/modules/finances/commandes.jsx";
import Remboursements from "../../components/modules/finances/remboursements.jsx";
import Depenses from "../../components/modules/finances/depenses.jsx";
import Entree from "../../components/modules/finances/entree.jsx";
import Abonnements from "../../components/modules/finances/abonnements.jsx";
import Reapprovisionnements from "../../components/modules/finances/reapprovisionnements.jsx";

const ongletContent = {
    [FINANCES_DASHBOARD]: <h1>Tableau de bord</h1>,
    [FINANCES_COMMANDES]: <Commandes />,
    [FINANCES_REMBOURSEMENTS]: <Remboursements />,
    [FINANCES_DEPENSES]: <Depenses />,
    [FINANCES_ENTREES]: <Entree />,
    [FINANCES_ABONNEMENTS]: <Abonnements />,
    [FINANCES_REAPPROVISIONNEMENTS]: <Reapprovisionnements />,
    [FINANCES_SALAIRES]: <h1>Salaires</h1>,
    [FINANCES_STATISTIQUES]: <h1>Statistiques</h1>,
};

function Finances({ onglet }) {
    return (
        <div>
            <Navbar onglet={onglet} />
            <main>
                {ongletContent[onglet] || <h1>Page non trouvée</h1>}
            </main>
        </div>
    );
}

export default Finances;