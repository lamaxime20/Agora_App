import { useState } from "react";
import ReapprovisionnementPane from "./ReapprovisionnementPane.jsx";

function HistoriqueReapprovisionnements() {
    const [selectedReappro, setSelectedReappro] = useState(null);
    const [filtreStatut, setFiltreStatut] = useState("tous");

    // Données de test d'historique des commandes passées
    const historiqueCommandes = [
        { 
            id: "REAPP-001", 
            date: "2026-05-20", 
            montantTotal: 1450.00, 
            statut: "Livré et stocké", 
            fournisseur: { id: "FOURN-01", nom: "Papeterie Centrale de l'Est", contact: "contact@papet-est.com" },
            articles: [
                { nom: "Rames de papier A4", quantite: 200, prixUnitaire: 4.50 },
                { nom: "Enveloppes cartonnées", quantite: 1000, prixUnitaire: 0.55 }
            ]
        },
        { 
            id: "REAPP-002", 
            date: "2026-06-02", 
            montantTotal: 850.00, 
            statut: "En cours d'acheminement", 
            fournisseur: { id: "FOURN-02", nom: "LogiTech Distribution", contact: "commercial@logitech-dist.fr" },
            articles: [
                { nom: "Écrans 24 pouces", quantite: 5, prixUnitaire: 170.00 }
            ]
        }
    ];

    const commandesFiltrees = historiqueCommandes.filter((cmd) => {
        if (filtreStatut === "tous") return true;
        return cmd.statut === filtreStatut;
    });

    const executerExport = (format) => {
        alert(`Génération et téléchargement du rapport de réapprovisionnement au format ${format}`);
    };

    return (
        <div>
            <h2>Historique des réapprovisionnements</h2>

            <section>
                <h4>Filtrer la recherche</h4>
                <label>Statut de la livraison : </label>
                <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
                    <option value="tous">Toutes les commandes</option>
                    <option value="Livré et stocké">Livré et stocké</option>
                    <option value="En cours d'acheminement">En cours d'acheminement</option>
                </select>
            </section>

            <section>
                <h4>Générer l'état des stocks commandés</h4>
                <button onClick={() => executerExport(".csv")}>Exporter en .csv</button>
                <button onClick={() => executerExport(".pdf")}>Exporter en .pdf</button>
                <button onClick={() => executerExport(".docx")}>Exporter en .docx</button>
            </section>

            <table>
                <thead>
                    <tr>
                        <th>Code Commande</th>
                        <th>Fournisseur</th>
                        <th>Date de commande</th>
                        <th>Montant Total HT</th>
                        <th>État Logistique</th>
                    </tr>
                </thead>
                <tbody>
                    {commandesFiltrees.map((reappro) => (
                        <tr key={reappro.id} onClick={() => setSelectedReappro(reappro)}>
                            <td>{reappro.id}</td>
                            <td>{reappro.fournisseur.nom}</td>
                            <td>{reappro.date}</td>
                            <td>{reappro.montantTotal.toFixed(2)} €</td>
                            <td>{reappro.statut}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedReappro && (
                <ReapprovisionnementPane 
                    reappro={selectedReappro} 
                    onClose={() => setSelectedReappro(null)} 
                />
            )}
        </div>
    );
}

export default HistoriqueReapprovisionnements;