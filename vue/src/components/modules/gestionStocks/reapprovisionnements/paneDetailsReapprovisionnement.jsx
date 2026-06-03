function PaneDetailsReapprovisionnement({ reappro, onClose }) {
    return (
        <aside>
            <header>
                <h2>Détails du réapprovisionnement</h2>
                <button onClick={onClose}>Fermer le volet</button>
            </header>

            <div>
                <p><strong>Date de la demande :</strong> {reappro.date}</p>
                <p><strong>Produit ciblé :</strong> {reappro.produit}</p>
                <p><strong>Quantité demandée :</strong> {reappro.quantite}</p>
                <p><strong>Coût total estimé :</strong> {reappro.cout}</p>
                <p><strong>Utilisateur demandeur :</strong> {reappro.demandeur}</p>
                <p><strong>Statut actuel :</strong> {reappro.statut}</p>
                
                {reappro.statut === 'annulé' && reappro.raisonAnnulation && (
                    <p><strong>Raison de l'annulation ou du refus :</strong> {reappro.raisonAnnulation}</p>
                )}
            </div>
        </aside>
    );
}

export default PaneDetailsReapprovisionnement;