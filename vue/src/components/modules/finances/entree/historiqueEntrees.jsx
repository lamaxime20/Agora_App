import { useState } from "react";
import EntreePane from "./EntreePane.jsx";

function HistoriqueEntrees() {
    const [selectedEntree, setSelectedEntree] = useState(null);
    const [filtreDate, setFiltreDate] = useState("");
    const [recherche, setRecherche] = useState("");

    // Jeu de données fictif pour l'historique des entrées générales
    const entreesInitiales = [
        { id: "ENT-2026-001", date: "2026-06-02", montant: 5000.00, description: "Apport externe de capital ou subvention d'exploitation" },
        { id: "ENT-2026-002", date: "2026-06-04", montant: 150.00, description: "Remboursement suite à un trop-perçu par un prestataire" }
    ];

    const entreesFiltrees = entreesInitiales.filter((entree) => {
        const correspondDate = filtreDate ? entree.date === filtreDate : true;
        const correspondTexte = entree.description.toLowerCase().includes(recherche.toLowerCase());
        return correspondDate && correspondTexte;
    });

    const declencherExport = (format) => {
        alert(`Génération et téléchargement du rapport de l'historique filtré des entrées au format ${format}`);
    };

    return (
        <div>
            <h2>Historique des entrées</h2>

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
                        <th>Date de l'entrée</th>
                        <th>Montant</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {entreesFiltrees.map((entree) => (
                        <tr key={entree.id} onClick={() => setSelectedEntree(entree)}>
                            <td>{entree.date}</td>
                            <td>{entree.montant} €</td>
                            <td>{entree.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedEntree && (
                <EntreePane 
                    entree={selectedEntree} 
                    onClose={() => setSelectedEntree(null)} 
                />
            )}
        </div>
    );
}

export default HistoriqueEntrees;