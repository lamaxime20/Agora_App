function PaneDetailsReservation({ reservation, onClose }) {
    // Calcul dynamique : Stock disponible = stock actuel - stock réservé
    const stockDisponible = reservation.stockActuel - reservation.stockReserve;

    return (
        <aside>
            <header>
                <h2>Détails de la Réservation</h2>
                <button onClick={onClose}>Fermer le volet</button>
            </header>

            <div>
                <h3>Informations Générales</h3>
                <p><strong>ID Commande :</strong> {reservation.id}</p>
                <p><strong>Date d'enregistrement :</strong> {reservation.date}</p>
                <p><strong>Client :</strong> {reservation.client}</p>
                <p><strong>Statut de la réservation :</strong> {reservation.statut}</p>

                <h3>Détails du Produit</h3>
                <p><strong>Nom :</strong> {reservation.produit}</p>
                <p><strong>Catégorie :</strong> {reservation.categorie}</p>
                <p><strong>Type :</strong> {reservation.type}</p>
                <p><strong>Quantité demandée (Réservée) :</strong> {reservation.quantite}</p>

                {/* Les indicateurs de stock s'appliquent uniquement aux produits physiques */}
                {reservation.type === 'physique' && (
                    <div>
                        <h3>Indicateurs de Stock (Calculés dynamiquement)</h3>
                        <ul>
                            <li><strong>Stock actuel en BD :</strong> {reservation.stockActuel} unités</li>
                            <li><strong>Stock réservé global (non stocké) :</strong> {reservation.stockReserve} unités</li>
                            <li><strong>Stock disponible à la vente :</strong> {stockDisponible} unités</li>
                        </ul>
                        
                        {reservation.statut === 'en_cours' && (
                            <p><em>Note : Le stock actuel ne sera diminué qu'au moment de la confirmation de la livraison associée.</em></p>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default PaneDetailsReservation;