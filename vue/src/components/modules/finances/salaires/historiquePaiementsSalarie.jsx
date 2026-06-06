import { useState } from "react";

function HistoriquePaiementsSalarie({ salarie, onBack }) {
    // Le state et la logique pour le pane de détails de paiement seront ajoutés ici

    return (
        <div>
            <header>
                <button onClick={onBack}>Retour à la liste</button>
                <h1>Historique des paiements pour {salarie.nom}</h1>
            </header>
            <div>
                {/* Des filtres et un bouton d'export seront ajoutés ici */}
            </div>
            <ul>
                {/* La liste des paiements de salaire sera mappée ici */}
                <li>Paiement 1... <button>Voir détails</button></li>
            </ul>
        </div>
    );
}

export default HistoriquePaiementsSalarie;