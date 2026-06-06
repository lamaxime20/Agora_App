import { useState } from "react";
import AbonnementPane from "./AbonnementPane.jsx";
import FormNouvelAbonnement from "./FormNouvelAbonnement.jsx";
import CouperAbonnementPane from "./CouperAbonnementPane.jsx";

function AbonnementsEnCours() {
    const [selectedAbonnement, setSelectedAbonnement] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [abonnementToCut, setAbonnementToCut] = useState(null);

    // Jeux de données de test pour abonnements actifs
    const abonnementsActifs = [
        { id: "ABO-01", dateDebut: "2026-01-10", montantMensuel: 49.99, nomService: "Hébergement Serveur Cloud", fournisseur: "AWS" },
        { id: "ABO-02", dateDebut: "2026-04-15", montantMensuel: 14.99, nomService: "Outil de Design Collaboratif", fournisseur: "Figma" }
    ];

    return (
        <div>
            <h2>Abonnements en cours</h2>

            <section>
                <button onClick={() => setShowAddModal(true)}>
                    Ajouter un nouvel abonnement
                </button>
            </section>

            <table>
                <thead>
                    <tr>
                        <th>Date d'abonnement</th>
                        <th>Montant par mois</th>
                        <th>Nom du service payé</th>
                        <th>Fournisseur</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {abonnementsActifs.map((sub) => (
                        <tr key={sub.id} onClick={() => setSelectedAbonnement(sub)}>
                            <td>{sub.dateDebut}</td>
                            <td>{sub.montantMensuel} €</td>
                            <td>{sub.nomService}</td>
                            <td>{sub.fournisseur}</td>
                            <td>
                                <button onClick={(e) => { e.stopPropagation(); setAbonnementToCut(sub); }}>
                                    Couper l'abonnement
                                </button>
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

            {showAddModal && (
                <FormNouvelAbonnement 
                    onClose={() => setShowAddModal(false)} 
                />
            )}

            {abonnementToCut && (
                <CouperAbonnementPane 
                    abonnement={abonnementToCut} 
                    onClose={() => setAbonnementToCut(null)} 
                />
            )}
        </div>
    );
}

export default AbonnementsEnCours;