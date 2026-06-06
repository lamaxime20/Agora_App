import { useState } from "react";

function EnregistrerPaiementForm({ commande, onClose }) {
    const [montant, setMontant] = useState("");
    const [modePaiement, setModePaiement] = useState("carte bancaire");
    const [reference, setReference] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!montant || montant <= 0) {
            alert("Veuillez saisir un montant valide.");
            return;
        }

        if (modePaiement !== "espèces" && !reference.trim()) {
            alert("La référence de transaction est obligatoire pour ce mode de paiement.");
            return;
        }

        const confirmation = window.confirm(
            `Confirmez-vous l'enregistrement de ce paiement ?\n\nMontant : ${montant} €\nMode : ${modePaiement}\nRéférence : ${modePaiement === "espèces" ? "Aucune" : reference}`
        );

        if (confirmation) {
            // Logique de soumission simulée
            alert("Paiement enregistré en base de données avec succès.");
            onClose();
        }
    };

    return (
        <dialog open>
            <div>
                <h4>Enregistrer un paiement pour {commande.nom}</h4>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Montant du paiement :</label>
                        <input 
                            type="number" 
                            value={montant} 
                            onChange={(e) => setMontant(e.target.value)} 
                            required 
                        />
                    </div>

                    <div>
                        <label>Mode de paiement :</label>
                        <select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
                            <option value="carte bancaire">Carte bancaire</option>
                            <option value="virement bancaire">Virement bancaire</option>
                            <option value="espèces">Espèces</option>
                            <option value="chèque">Chèque</option>
                        </select>
                    </div>

                    {modePaiement !== "espèces" && (
                        <div>
                            <label>Référence de transaction :</label>
                            <input 
                                type="text" 
                                value={reference} 
                                onChange={(e) => setReference(e.target.value)} 
                                required
                            />
                        </div>
                    )}

                    <div>
                        <button type="submit">Confirmer l'enregistrement</button>
                        <button type="button" onClick={onClose}>Annuler</button>
                    </div>
                </form>
            </div>
        </dialog>
    );
}

export default EnregistrerPaiementForm;