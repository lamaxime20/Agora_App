import { useState } from "react";
import DepensePane from "./DepensePane.jsx";

function HistoriqueDepenses() {
    const [selectedDepense, setSelectedDepense] = useState(null);
    const [filtreDate, setFiltreDate] = useState("");
    const [recherche, setRecherche] = useState("");

    // Jeu de données de test
    const depensesInitiales = [
        { id: "DEP-2026-001", date: "2026-06-01", montant: 89.90, description: "Achat de rames de papier A4 et fournitures de bureau" },
        { id: "DEP-2026-002", date: "2026-06-03", montant: 1200.00, description: "Paiement de la facture d'électricité du siège social" },
        { id: "DEP-2026-003", date: "2026-06-05", montant: 350.00, description: "Maintenance informatique sur le serveur local" }
    ];

    const depensesFiltrees = depensesInitiales.filter((depense) => {
        const correspondDate = filtreDate ? depense.date === filtreDate : true;
        const correspondTexte = depense.description.toLowerCase().includes(recherche.toLowerCase());
        return correspondDate && correspondTexte;
    });

    const declencherExport = (format) => {
        alert(`Génération et téléchargement du rapport de l'historique filtré des dépenses au format ${format}`);
    };

    return (
        <div>
            <h2>Historique des dépenses</h2>

            <section>
                <h4>Outils de filtrage et recherche</h4>
                <label>Filtrer par date exacte : </label>
                <input 
                    type="date" 
                    value={filtreDate} 
                    onChange={(e) => setFiltreDate(e.target.value)} 
                />

                <label> Rechercher par mot-clé : </label>
                <input 
                    type="text" 
                    placeholder="Filtrer la description..." 
                    value={recherche} 
                    onChange={(e) => setRecherche(e.target.value)} 
                />
            </section>

            <section>
                <h4>Générer le rapport de la liste filtrée</h4>
                <button onClick={() => declencherExport(".csv")}>Exporter en .csv</button>
                <button onClick={() => declencherExport(".pdf")}>Exporter en .pdf</button>
                <button onClick={() => declencherExport(".docx")}>Exporter en .docx</button>
            </section>

            <table>
                <thead>
                    <tr>
                        <th>Date de la dépense</th>
                        <th>Montant</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {depensesFiltrees.map((depense) => (
                        <tr key={depense.id} onClick={() => setSelectedDepense(depense)}>
                            <td>{depense.date}</td>
                            <td>{depense.montant} €</td>
                            <td>{depense.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedDepense && (
                <DepensePane 
                    depense={selectedDepense} 
                    onClose={() => setSelectedDepense(null)} 
                />
            )}
        </div>
    );
}

export default HistoriqueDepenses;