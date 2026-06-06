import { useState } from "react";
import PaiementPane from "./PaiementPane.jsx";

function HistoriquePaiements() {
    const [selectedPaiement, setSelectedPaiement] = useState(null);
    const [filtreDate, setFiltreDate] = useState("");
    const [filtreMode, setFiltreMode] = useState("");

    // Historique global fictif des paiements
    const paiements = [
        { id: "P-101", date: "2026-06-02", montant: 1500, mode: "carte bancaire", reference: "CB-77312", utilisateur: "Alice Caisse", commandeAssociee: { id: "CMD-889", nom: "Commande Client Dupond", total: 1500 } },
        { id: "P-102", date: "2026-06-05", montant: 450, mode: "espèces", reference: "", utilisateur: "Jean Comptable", commandeAssociee: { id: "CMD-990", nom: "Commande Client Martin", total: 900 } }
    ];

    const declarerExport = (format) => {
        alert(`Génération et téléchargement du rapport au format ${format}`);
    };

    return (
        <div>
            <h2>Historique général des paiements</h2>

            <section>
                <h4>Filtres de recherche</h4>
                <label>Date : </label>
                <input type="date" value={filtreDate} onChange={(e) => setFiltreDate(e.target.value)} />

                <label> Mode : </label>
                <select value={filtreMode} onChange={(e) => setFiltreMode(e.target.value)}>
                    <option value="">Tous les modes</option>
                    <option value="carte bancaire">Carte bancaire</option>
                    <option value="virement bancaire">Virement bancaire</option>
                    <option value="espèces">Espèces</option>
                    <option value="chèque">Chèque</option>
                </select>
            </section>

            <section>
                <h4>Exporter la liste filtrée</h4>
                <button onClick={() => declarerExport(".csv")}>Exporter en .csv</button>
                <button onClick={() => declarerExport(".pdf")}>Exporter en .pdf</button>
                <button onClick={() => declarerExport(".docx")}>Exporter en .docx</button>
            </section>

            <table>
                <thead>
                    <tr>
                        <th>Date du paiement</th>
                        <th>Montant payé</th>
                        <th>Mode de paiement</th>
                        <th>Référence de transaction</th>
                        <th>Utilisateur ayant enregistré</th>
                    </tr>
                </thead>
                <tbody>
                    {paiements.map((paiement) => (
                        <tr key={paiement.id} onClick={() => setSelectedPaiement(paiement)}>
                            <td>{paiement.date}</td>
                            <td>{paiement.montant} €</td>
                            <td>{paiement.mode}</td>
                            <td>{paiement.reference || "Espèces"}</td>
                            <td>{paiement.utilisateur}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedPaiement && (
                <PaiementPane 
                    paiement={selectedPaiement} 
                    onClose={() => setSelectedPaiement(null)} 
                />
            )}
        </div>
    );
}

export default HistoriquePaiements;