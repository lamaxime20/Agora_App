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

const ongletContent = {
    [FINANCES_DASHBOARD]: <h1>Tableau de bord</h1>,
    [FINANCES_COMMANDES]: <h1>Commandes</h1>,
    [FINANCES_REMBOURSEMENTS]: <h1>Remboursements</h1>,
    [FINANCES_DEPENSES]: <h1>Dépenses</h1>,
    [FINANCES_ENTREES]: <h1>Entrées</h1>,
    [FINANCES_ABONNEMENTS]: <h1>Abonnements</h1>,
    [FINANCES_REAPPROVISIONNEMENTS]: <h1>Réapprovisionnements</h1>,
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