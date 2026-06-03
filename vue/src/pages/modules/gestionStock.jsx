import {
    GESTION_STOCK_DASHBOARD,
    GESTION_STOCK_PRODUITS,
    GESTION_STOCK_REAPPROVISIONNEMENT,
    GESTION_STOCK_RESERVATIONS,
    GESTION_STOCK_PERTES,
    GESTION_STOCK_STATISTIQUES
} from "../../services/gestionStock.js";
import Navbar from "../../components/modules/gestionStocks/navbar.jsx";

const ongletContent = {
    [GESTION_STOCK_DASHBOARD]: <h1>Tableau de bord</h1>,
    [GESTION_STOCK_PRODUITS]: <h1>Produits</h1>,
    [GESTION_STOCK_REAPPROVISIONNEMENT]: <h1>Réapprovisionnement</h1>,
    [GESTION_STOCK_RESERVATIONS]: <h1>Réservations</h1>,
    [GESTION_STOCK_PERTES]: <h1>Pertes</h1>,
    [GESTION_STOCK_STATISTIQUES]: <h1>Statistiques</h1>,
};

function GestionStock({ onglet }) {
    return (
        <div className="gestionStock-root">
            <Navbar onglet={ onglet } />
            <main className="gestionStock-main">
                {ongletContent[onglet] || <h1>Page non trouvée</h1>}
            </main>
        </div>
    );
}

export default GestionStock;