import { useState } from "react";

function EnregistrerEntree() {
    const [dateEntree, setDateEntree] = useState("");
    const [montant, setMontant] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!dateEntree) {
            alert("Veuillez sélectionner une date valide.");
            return;
        }

        if (!montant || parseFloat(montant) <= 0) {
            alert("Veuillez entrer un montant supérieur à 0.");
            return;
        }

        if (!description.trim()) {
            alert("Veuillez renseigner la description de l'entrée.");
            return;
        }

        const confirmation = window.confirm(
            `Veuillez vérifier les informations avant validation :\n\nDate : ${dateEntree}\nMontant : ${montant} €\nDescription : ${description}\n\nConfirmez-vous l'enregistrement ?`
        );

        if (confirmation) {
            // Simulation de l'insertion en base de données et exécution du service financier backend
            alert("L'entrée financière a été enregistrée avec succès.");
            // Réinitialisation des champs du formulaire
            setDateEntree("");
            setMontant("");
            setDescription("");
        }
    };

    return (
        <div>
            <h2>Enregistrer une entrée financière</h2>
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Date de l'entrée :</label>
                    <input 
                        type="date" 
                        value={dateEntree} 
                        onChange={(e) => setDateEntree(e.target.value)} 
                        required 
                    />
                </div>

                <div>
                    <label>Montant de l'entrée :</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={montant} 
                        onChange={(e) => setMontant(e.target.value)} 
                        required 
                    />
                </div>

                <div>
                    <label>Description de l'entrée :</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        rows="4" 
                        placeholder="Origine des fonds, motif..."
                        required 
                    />
                </div>

                <div>
                    <button type="submit">Confirmer l'enregistrement de l'entrée</button>
                </div>
            </form>
        </div>
    );
}

export default EnregistrerEntree;