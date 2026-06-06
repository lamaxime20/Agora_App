import { useState } from "react";

function EnregistrerDepense() {
    const [dateDepense, setDateDepense] = useState("");
    const [montant, setMontant] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!dateDepense) {
            alert("Veuillez sélectionner une date valide.");
            return;
        }

        if (!montant || parseFloat(montant) <= 0) {
            alert("Veuillez entrer un montant supérieur à 0.");
            return;
        }

        if (!description.trim()) {
            alert("Veuillez renseigner la description de la dépense.");
            return;
        }

        const confirmation = window.confirm(
            `Veuillez vérifier les informations avant validation :\n\nDate : ${dateDepense}\nMontant : ${montant} €\nDescription : ${description}\n\nConfirmez-vous l'enregistrement ?`
        );

        if (confirmation) {
            // Simulation de l'insertion en base de données
            alert("La dépense a été enregistrée avec succès.");
            // Réinitialisation des champs du formulaire
            setDateDepense("");
            setMontant("");
            setDescription("");
        }
    };

    return (
        <div>
            <h2>Enregistrer une dépense</h2>
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Date de la dépense :</label>
                    <input 
                        type="date" 
                        value={dateDepense} 
                        onChange={(e) => setDateDepense(e.target.value)} 
                        required 
                    />
                </div>

                <div>
                    <label>Montant de la dépense :</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={montant} 
                        onChange={(e) => setMontant(e.target.value)} 
                        required 
                    />
                </div>

                <div>
                    <label>Description de la dépense :</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        rows="4" 
                        placeholder="Détails du paiement, motif..."
                        required 
                    />
                </div>

                <div>
                    <button type="submit">Confirmer l'enregistrement de la dépense</button>
                </div>
            </form>
        </div>
    );
}

export default EnregistrerDepense;