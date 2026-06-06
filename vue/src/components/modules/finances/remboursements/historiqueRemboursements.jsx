import { useState } from "react";
import RemboursementPane from "./RemboursementPane.jsx";

function HistoriqueRemboursements() {
    const [selectedRemboursement, setSelectedRemboursement] = useState(null);
    const [filtreDate, setFiltreDate] = useState("");

    // Données de test de l'historique des remboursements
    const remboursements = [
        { 
            id: "REM-001", 
            montant: 300, 
            cause: "Rupture de stock sur l'article principal", 
            date: "2026-06-03", 
            utilisateur: "Alice Caisse",
            commandeAssociee: { id: "CMD-201", nom: "Commande #201 - Client Durand", totalFacture: 1200, totalPaye: 1200 }
        },
        { 
            id: "REM-002", 
            montant: 150, 
            cause: "Geste commercial suite à un retard d'expédition", 
            date: "2026-06-04", 
            utilisateur: "Jean Comptable",
            commandeAssociee: { id: "CMD-202", nom: "Commande #202 - Client Moreau", totalFacture: 450, totalPaye: 450 }
        }
    ];

    const executerExport = (format) => {
        alert(`Génération et téléchargement du rapport des remboursements au format ${format}`);
    };

    return (
        <div>
            <h2>Historique des remboursements</h2>

            <section>
                <h4>Filtres de recherche</h4>
                <label>Date du remboursement : </label>
                <input type="date" value={filtreDate} onChange={(e) => setFiltreDate(e.target.value)} />
            </section>

            <section>
                <h4>Générer le rapport de la liste filtrée</h4>
                <button onClick={() => executerExport(".csv")}>Exporter en .csv</button>
                <button onClick={() => executerExport(".pdf")}>Exporter en .pdf</button>
                <button onClick={() => executerExport(".docx")}>Exporter en .docx</button>
            </section>

            <table>
                <thead>
                    <tr>
                        <th>Commande associée</th>
                        <th>Montant du remboursement</th>
                        <th>Cause du remboursement</th>
                        <th>Date du remboursement</th>
                        <th>Utilisateur ayant enregistré</th>
                    </tr>
                </thead>
                <tbody>
                    {remboursements.map((remboursement) => (
                        <tr key={remboursement.id} onClick={() => setSelectedRemboursement(remboursement)}>
                            <td>{remboursement.commandeAssociee.nom}</td>
                            <td>{remboursement.montant} €</td>
                            <td>{remboursement.cause}</td>
                            <td>{remboursement.date}</td>
                            <td>{remboursement.utilisateur}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedRemboursement && (
                <RemboursementPane 
                    remboursement={selectedRemboursement} 
                    onClose={() => setSelectedRemboursement(null)} 
                />
            )}
        </div>
    );
}

export default HistoriqueRemboursements;