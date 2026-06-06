function AbonnementPane({ abonnement, onClose }) {
    return (
        <aside>
            <div>
                <button onClick={onClose}>Fermer le volet</button>
                <h3>Fiche de l'Abonnement</h3>
                <ul>
                    <li><strong>Nom du service :</strong> {abonnement.nomService}</li>
                    <li><strong>Fournisseur :</strong> {abonnement.fournisseur}</li>
                    <li><strong>Frais mensuels :</strong> {abonnement.montantMensuel} €</li>
                    <li><strong>Date de mise en service :</strong> {abonnement.dateDebut}</li>
                    {abonnement.dateFin && <li><strong>Date de résiliation :</strong> {abonnement.dateFin}</li>}
                    <li><strong>État :</strong> {abonnement.dateFin ? "Inactif" : "Actif"}</li>
                </ul>
            </div>
        </aside>
    );
}

export default AbonnementPane;