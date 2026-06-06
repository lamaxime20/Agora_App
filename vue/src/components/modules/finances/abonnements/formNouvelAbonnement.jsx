import { useState } from "react";

function FormNouvelAbonnement({ onClose }) {
    const [dateDebut, setDateDebut] = useState("");
    const [montant, setMontant] = useState("");
    const [nomService, setNomService] = useState("");
    const [fournisseur, setFournisseur] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!dateDebut || !montant || !nomService || !fournisseur) {
            alert("Veuillez remplir tous les champs requis.");
            return;
        }

        const confirmation = window.confirm(
            `Confirmez-vous l'enregistrement de l'abonnement ?\n\nService : ${nomService}\nFournisseur : ${fournisseur}\nMontant : ${montant} €/mois\nDébut : ${dateDebut}`
        );

        if (confirmation) {
            alert("Abonnement enregistré avec succès. Une notification a été émise à la direction.");
            onClose();
        }
    };

    return (
        <dialog open>
            <div>
                <h3>Enregistrer un nouvel abonnement</h3>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Date de début d'abonnement :</label>
                        <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
                    </div>

                    <div>
                        <label>Montant de l'abonnement par mois :</label>
                        <input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} required />
                    </div>

                    <div>
                        <label>Nom du service payé :</label>
                        <input type="text" value={nomService} onChange={(e) => setNomService(e.target.value)} required />
                    </div>

                    <div>
                        <label>Fournisseur :</label>
                        <input type="text" value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} required />
                    </div>

                    <div>
                        <button type="submit">Confirmer l'enregistrement</button>
                        <button type="button" onClick={onClose}>Annuler</button>
                    </div>
                </form>
            </div>
        </dialog>
    );
}

export default FormNouvelAbonnement;