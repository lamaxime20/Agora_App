import { useState } from "react";
import CommandePane from "./CommandePane.jsx";

function CommandesEnAttente() {
    const [selectedCommande, setSelectedCommande] = useState(null);
    
    // Données de test pour illustrer le fonctionnement
    const [commandes, setCommandes] = useState([
        { id: "CMD-001", nom: "Commande Alpha", total: 1500, minimumValidation: 1500, paye: 500, statut: "partiellement payé" },
        { id: "CMD-002", nom: "Commande Beta", total: 800, minimumValidation: 800, paye: 0, statut: "en attente de paiement" }
    ]);

    const modifierSeuilMinimum = (id) => {
        const nouveauSeuil = prompt("Entrez le nouveau montant total de paiement minimum pour valider la commande :");
        if (nouveauSeuil !== null && !isNaN(nouveauSeuil)) {
            setCommandes(commandes.map(cmd => 
                cmd.id === id ? { ...cmd, minimumValidation: parseFloat(nouveauSeuil) } : cmd
            ));
        }
    };

    return (
        <div>
            <h2>Commandes en attente de paiement complet</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>Référence</th>
                        <th>Nom</th>
                        <th>Montant Total</th>
                        <th>Seuil Minimum de Validation (Cliquer pour modifier)</th>
                        <th>Montant Payé</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    {commandes.map((commande) => (
                        <tr key={commande.id} onClick={() => setSelectedCommande(commande)}>
                            <td>{commande.id}</td>
                            <td>{commande.nom}</td>
                            <td>{commande.total} €</td>
                            <td onClick={(e) => { e.stopPropagation(); modifierSeuilMinimum(commande.id); }}>
                                <strong>{commande.minimumValidation} €</strong>
                            </td>
                            <td>{commande.paye} €</td>
                            <td>{commande.statut}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedCommande && (
                <CommandePane 
                    commande={selectedCommande} 
                    onClose={() => setSelectedCommande(null)} 
                />
            )}
        </div>
    );
}

export default CommandesEnAttente;