import { useState } from "react";
import DetailsCommandeModal from "./DetailsCommandeModal.jsx";

function PaiementPane({ paiement, onClose }) {
    const [showCommandeModal, setShowCommandeModal] = useState(false);

    return (
        <aside>
            <div>
                <button onClick={onClose}>Fermer le volet</button>
                <h3>Informations du Paiement {paiement.id}</h3>

                <p><strong>Date :</strong> {paiement.date}</p>
                <p><strong>Montant :</strong> {paiement.montant} €</p>
                <p><strong>Mode de paiement :</strong> {paiement.mode}</p>
                <p><strong>Référence :</strong> {paiement.reference || "Aucune (Espèces)"}</p>
                <p><strong>Enregistré par :</strong> {paiement.utilisateur}</p>

                <hr />
                
                <button onClick={() => setShowCommandeModal(true)}>
                    Voir la commande associée
                </button>

                {showCommandeModal && (
                    <DetailsCommandeModal 
                        commande={paiement.commandeAssociee} 
                        onClose={() => setShowCommandeModal(false)} 
                    />
                )}
            </div>
        </aside>
    );
}

export default PaiementPane;