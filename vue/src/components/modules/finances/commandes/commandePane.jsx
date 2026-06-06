import { useState } from "react";
import EnregistrerPaiementForm from "./EnregistrerPaiementForm.jsx";

function CommandePane({ commande, onClose }) {
    const [showFormPaiement, setShowFormPaiement] = useState(false);

    // Historique de test lié à la commande
    const historiquePaiements = [
        { date: "2026-06-01", montant: 500, mode: "virement bancaire", reference: "VR-98234", utilisateur: "Jean Comptable" }
    ];

    return (
        <aside>
            <div>
                <button onClick={onClose}>Fermer le volet</button>
                <h3>Détails de la commande : {commande.nom}</h3>
                
                <section>
                    <p><strong>Référence :</strong> {commande.id}</p>
                    <p><strong>Montant Total :</strong> {commande.total} €</p>
                    <p><strong>Seuil de validation :</strong> {commande.minimumValidation} €</p>
                    <p><strong>Reste à payer :</strong> {commande.total - commande.paye} €</p>
                    <p><strong>Statut actuel :</strong> {commande.statut}</p>
                    
                    <button onClick={() => setShowFormPaiement(true)}>Enregistrer un paiement</button>
                </section>

                <hr />

                <section>
                    <h4>Historique des paiements associés</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Montant</th>
                                <th>Mode de paiement</th>
                                <th>Référence</th>
                                <th>Utilisateur</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historiquePaiements.map((p, index) => (
                                <tr key={index}>
                                    <td>{p.date}</td>
                                    <td>{p.montant} €</td>
                                    <td>{p.mode}</td>
                                    <td>{p.reference || "-"}</td>
                                    <td>{p.utilisateur}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {showFormPaiement && (
                    <EnregistrerPaiementForm 
                        commande={commande} 
                        onClose={() => setShowFormPaiement(false)} 
                    />
                )}
            </div>
        </aside>
    );
}

export default CommandePane;