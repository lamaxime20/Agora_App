import { useState } from "react";

function ChoixCommandePane({ onSelectCommande, onClose }) {
    const [searchQuery, setSearchQuery] = useState("");

    // Données de test : Commandes payées ou partiellement payées mais pas encore livrées
    const commandesEligibles = [
        { id: "CMD-201", nom: "Commande #201 - Client Durand", totalPaye: 1200, statutLivraison: "Non livrée" },
        { id: "CMD-202", nom: "Commande #202 - Client Moreau", totalPaye: 450, statutLivraison: "En préparation" },
        { id: "CMD-203", nom: "Commande #203 - Client Lefevre", totalPaye: 900, statutLivraison: "Non livrée" }
    ];

    const commandesFiltrees = commandesEligibles.filter(cmd =>
        cmd.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <aside>
            <div>
                <button onClick={onClose}>Fermer le volet</button>
                <h3>Sélectionner une commande éligible au remboursement</h3>
                
                <section>
                    <label>Rechercher une commande : </label>
                    <input 
                        type="text" 
                        placeholder="Filtrer par nom ou référence..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </section>

                <table>
                    <thead>
                        <tr>
                            <th>Référence</th>
                            <th>Nom / Client</th>
                            <th>Montant déjà payé</th>
                            <th>État livraison</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commandesFiltrees.map((commande) => (
                            <tr key={commande.id}>
                                <td>{commande.id}</td>
                                <td>{commande.nom}</td>
                                <td>{commande.totalPaye} €</td>
                                <td>{commande.statutLivraison}</td>
                                <td>
                                    <button onClick={() => onSelectCommande(commande)}>
                                        Choisir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </aside>
    );
}

export default ChoixCommandePane;