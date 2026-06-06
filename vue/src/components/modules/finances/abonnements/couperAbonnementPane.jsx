import { useState } from "react";

function CouperAbonnementPane({ abonnement, onClose }) {
    const [couperArgentMois, setCouperArgentMois] = useState("non");

    const handleConfirm = () => {
        const prelevement = couperArgentMois === "oui" 
            ? "Le mois en cours a été prélevé sur l'argent virtuel." 
            : "Aucun prélèvement appliqué pour le mois en cours.";

        alert(`L'abonnement '${abonnement.nomService}' a été marqué comme inactif.\nDate de fin archivée.\n\nStatut financier : ${prelevement}`);
        onClose();
    };

    return (
        <dialog open>
            <div>
                <h3>Résilier l'abonnement : {abonnement.nomService}</h3>
                <p>Fournisseur ciblé : {abonnement.fournisseur}</p>
                
                <fieldset>
                    <legend>Gestion des fonds du mois courant</legend>
                    <label>
                        <input 
                            type="radio" 
                            name="fondsMois" 
                            value="oui" 
                            checked={couperArgentMois === "oui"} 
                            onChange={() => setCouperArgentMois("oui")} 
                        />
                        Couper (prélever) l'argent du mois en cours
                    </label>
                    <br />
                    <label>
                        <input 
                            type="radio" 
                            name="fondsMois" 
                            value="non" 
                            checked={couperArgentMois === "non"} 
                            onChange={() => setCouperArgentMois("non")} 
                        />
                        Ne pas prélever le mois en cours
                    </label>
                </fieldset>

                <div>
                    <button onClick={handleConfirm}>Confirmer la coupure de l'abonnement</button>
                    <button type="button" onClick={onClose}>Annuler</button>
                </div>
            </div>
        </dialog>
    );
}

export default CouperAbonnementPane;