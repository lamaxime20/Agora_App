function PaneDetailsTransaction({ transaction, onClose }) {
    return (
        <aside>
            <header>
                <h2>Détails de la transaction</h2>
                <button onClick={onClose}>Fermer le volet</button>
            </header>
            
            <div>
                <p><strong>Action :</strong> {transaction.type}</p>
                <p><strong>Date :</strong> {transaction.date}</p>
                <p><strong>Produit concerné :</strong> {transaction.produit}</p>
                
                {/* Ici s'afficheront d'autres détails : raison de la perte, montant du ravitaillement, etc. */}
            </div>
        </aside>
    );
}

export default PaneDetailsTransaction;