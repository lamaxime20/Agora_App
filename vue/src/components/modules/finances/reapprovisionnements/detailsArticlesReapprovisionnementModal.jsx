function DetailsArticlesReapprovisionnementModal({ articles, commandeId, onClose }) {
    return (
        <dialog open>
            <div>
                <h3>Contenu détaillé du bon de commande : {commandeId}</h3>
                
                <table>
                    <thead>
                        <tr>
                            <th>Nom de l'article</th>
                            <th>Quantité demandée</th>
                            <th>Prix unitaire d'achat</th>
                            <th>Sous-total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.map((art, index) => (
                            <tr key={index}>
                                <td>{art.nom}</td>
                                <td>{art.quantite}</td>
                                <td>{art.prixUnitaire.toFixed(2)} €</td>
                                <td>{(art.quantite * art.prixUnitaire).toFixed(2)} €</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <br />
                <button onClick={onClose}>Fermer la liste d'articles</button>
            </div>
        </dialog>
    );
}

export default DetailsArticlesReapprovisionnementModal;