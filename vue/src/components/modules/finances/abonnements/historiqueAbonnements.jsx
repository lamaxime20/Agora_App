import { useState } from "react";
import AbonnementPane from "./AbonnementPane.jsx";
import ReactiverAbonnementPane from "./ReactiverAbonnementPane.jsx";

function HistoriqueAbonnements() {
    const [selectedAbonnement, setSelectedAbonnement] = useState(null);
    const [subToReactivate, setSubToReactivate] = useState(null);
    const [filtreStatut, setFiltreStatut] = useState("tous");

    // Données de test historiques mixtes
    const archiveAbonnements = [
        { id: "ABO-01", dateDebut: "2026-01-10", dateFin: null, montantMensuel: 49.99, nomService: "Hébergement Serveur Cloud", fournisseur: "AWS" },
        { id: "ABO-02", dateDebut: "2026-04-15", dateFin: null, montantMensuel: 14.99, nomService: "Outil de Design Collaboratif", fournisseur: "Figma" },
        { id: "ABO-03", dateDebut: "2024-02-01", dateFin: "2026-03-01", montantMensuel: 9.99, nomService: "Banque d'images Premium", fournisseur: "Shutterstock" }
    ];

    const listeFiltrée = archiveAbonnements.filter((sub) => {
        if (filtreStatut === "actif") return !sub.dateFin;
        if (filtreStatut === "inactif") return sub.dateFin;
        return true;
    });

    const declarerExport = (typeFormat) => {
        alert(`Génération et extraction du rapport d'historique des abonnements au format ${typeFormat}`);
    };

    return (
        <div>
            <h2>Historique des abonnements</h2>

            <section>
                <h4>Filtres & Édition</h4>
                <label>Filtrer par statut : </label>
                <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
                    <option value="tous">Tous les abonnements</option>
                    <option value="actif">Actifs uniquement</option>
                    <option value="inactif">Inactifs uniquement</option>
                </select>
            </section>

            <section>
                <h4>Télécharger les exports</h4>
                <button onClick={() => declarerExport(".csv")}>Exporter en .csv</button>
                <button onClick={() => declarerExport(".pdf")}>Exporter en .pdf</button>
                <button onClick={() => declarerExport(".docx")}>Exporter en .docx</button>
            </section>

            <table>
                <thead>
                    <tr>
                        <th>Date de début</th>
                        <th>Date de fin</th>
                        <th>Montant / mois</th>
                        <th>Nom du service</th>
                        <th>Fournisseur</th>
                        <th>Gestion</th>
                    </tr>
                </thead>
                <tbody>
                    {listeFiltrée.map((sub) => (
                        <tr key={sub.id} onClick={() => setSelectedAbonnement(sub)}>
                            <td>{sub.dateDebut}</td>
                            <td>{sub.dateFin || "Abonnement Actif"}</td>
                            <td>{sub.montantMensuel} €</td>
                            <td>{sub.nomService}</td>
                            <td>{sub.fournisseur}</td>
                            <td>
                                {sub.dateFin && (
                                    <button onClick={(e) => { e.stopPropagation(); setSubToReactivate(sub); }}>
                                        Réactiver
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedAbonnement && (
                <AbonnementPane 
                    abonnement={selectedAbonnement} 
                    onClose={() => setSelectedAbonnement(null)} 
                />
            )}

            {subToReactivate && (
                <ReactiverAbonnementPane 
                    abonnement={subToReactivate} 
                    onClose={() => setSubToReactivate(null)} 
                />
            )}
        </div>
    );
}

export default HistoriqueAbonnements;