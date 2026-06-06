import { useState } from "react";
import ChoixCommandePane from "./ChoixCommandePane.jsx";

function EnregistrerRemboursement() {
    const [selectedCommande, setSelectedCommande] = useState(null);
    const [montant, setMontant] = useState("");
    const [cause, setCause] = useState("");
    const [showChoixPane, setShowChoixPane] = useState(false);

    const handleSelectCommande = (commande) => {
        setSelectedCommande(commande);
        setShowChoixPane(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedCommande) {
            alert("Veuillez sélectionner une commande.");
            return;
        }

        if (!montant || montant <= 0) {
            alert("Veuillez saisir un montant valide.");
            return;
        }

        if (parseFloat(montant) > selectedCommande.totalPaye) {
            alert(`Erreur : Le montant du remboursement ne peut pas dépasser le total payé par le client (${selectedCommande.totalPaye} €).`);
            return;
        }

        if (!cause.trim()) {
            alert("Veuillez renseigner la cause du remboursement.");
            return;
        }

        const confirmation = window.confirm(
            `Confirmez-vous l'enregistrement de ce remboursement ?\n\nCommande : ${selectedCommande.nom}\nMontant : ${montant} €\nCause : ${cause}`
        );

        if (confirmation) {
            alert("Remboursement enregistré avec succès dans la base de données.");
            // Réinitialisation du formulaire
            setSelectedCommande(null);
            setMontant("");
            setCause("");
        }
    };

    return (
        <div>
            <h2>Enregistrer un remboursement</h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Choix de la commande :</label>
                    <input 
                        type="text" 
                        readOnly 
                        placeholder="Cliquez sur le bouton pour choisir..." 
                        value={selectedCommande ? selectedCommande.nom : ""} 
                        required
                    />
                    <button type="button" onClick={() => setShowChoixPane(true)}>
                        Sélectionner une commande
                    </button>
                </div>

                {selectedCommande && (
                    <div>
                        <p>
                            <em>Informations de la commande sélectionnée — Montant total payé par le client : {selectedCommande.totalPaye} €</em>
                        </p>
                    </div>
                )}

                <div>
                    <label>Montant du remboursement :</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={montant} 
                        onChange={(e) => setMontant(e.target.value)} 
                        required 
                    />
                </div>

                <div>
                    <label>La cause du remboursement :</label>
                    <textarea 
                        value={cause} 
                        onChange={(e) => setCause(e.target.value)} 
                        rows="4"
                        required
                    />
                </div>

                <div>
                    <button type="submit">Confirmer l'enregistrement du remboursement</button>
                </div>
            </form>

            {showChoixPane && (
                <ChoixCommandePane 
                    onSelectCommande={handleSelectCommande} 
                    onClose={() => setShowChoixPane(false)} 
                />
            )}
        </div>
    );
}

export default EnregistrerRemboursement;