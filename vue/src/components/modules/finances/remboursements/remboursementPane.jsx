import { useState } from "react";
import DetailsCommandeRemboursementModal from "./DetailsCommandeRemboursementModal.jsx";

function RemboursementPane({ remboursement, onClose }) {
    const [showCommandeModal, setShowCommandeModal] = useState(false);

    return (
        <aside>
            <div>
                <button onClick={onClose}>Fermer le volet</button>
                <h3>Détails du Remboursement {remboursement.id}</h3>

                <p><strong>Commande associée :</strong> {remboursement.commandeAssociee.nom}</p>
                <p><strong>Montant remboursé :</strong> {remboursement.montant} €</p>
                <p><strong>Cause renseignée :</strong> {remboursement.cause}</p>
                <p><strong>Date de l'opération :</strong> {remboursement.date}</p>
                <p><strong>Enregistré par :</strong> {remboursement.utilisateur}</p>

                <hr />

                <button onClick={() => setShowCommandeModal(true)}>
                    Voir la commande associée à ce remboursement
                </button>

                {showCommandeModal && (
                    <DetailsCommandeRemboursementModal 
                        commande={remboursement.commandeAssociee} 
                        onClose={() => setShowCommandeModal(false)} 
                    />
                )}
            </div>
        </aside>
    );
}

export default RemboursementPane;