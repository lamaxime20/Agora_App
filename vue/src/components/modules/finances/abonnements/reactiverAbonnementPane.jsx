import { useState } from "react";

function ReactiverAbonnementPane({ abonnement, onClose }) {
    const [payerMoisCourant, setPayerMoisCourant] = useState("non");

    const handleConfirm = () => {
        const detailFinancier = payerMoisCourant === "oui"
            ? `Paiement immédiat de ${abonnement.montantMensuel} € enregistré (Réf: abonnement réactivé ${abonnement.nomService}). Argent virtuel déduit.`
            : "Réactivation effectuée sans prélèvement immédiat pour le mois courant.";

        alert(`L'abonnement '${abonnement.nomService}' est repassé au statut Actif.\nDate de début mise à jour à la date du jour.\n\n${detailFinancier}`);
        onClose();
    };

    return (
        <dialog open>
            <div>
                <h3>Réactiver l'abonnement : {abonnement.nomService}</h3>
                <p>Fournisseur : {abonnement.fournisseur} — {abonnement.montantMensuel} €/mois</p>

                <fieldset>
                    <legend>Facturation immédiate</legend>
                    <label>
                        <input 
                            type="radio" 
                            name="facturationCourante" 
                            value="oui" 
                            checked={payerMoisCourant === "oui"} 
                            onChange={() => setPayerMoisCourant("oui")} 
                        />
                        Payer le mois en cours immédiatement (Prélèvement virtuel)
                    </label>
                    <br />
                    <label>
                        <input 
                            type="radio" 
                            name="facturationCourante" 
                            value="non" 
                            checked={payerMoisCourant === "non"} 
                            onChange={() => setPayerMoisCourant("non")} 
                        />
                        Ne pas payer le mois courant immédiatement
                    </label>
                </fieldset>

                <div>
                    <button onClick={handleConfirm}>Confirmer la réactivation</button>
                    <button type="button" onClick={onClose}>Annuler</button>
                </div>
            </div>
        </dialog>
    );
}

export default ReactiverAbonnementPane;