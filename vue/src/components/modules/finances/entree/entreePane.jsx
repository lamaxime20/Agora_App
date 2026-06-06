function EntreePane({ entree, onClose }) {
    return (
        <aside>
            <div>
                <button onClick={onClose}>Fermer le volet</button>
                
                <h3>Détails complets de l'entrée</h3>
                
                <section>
                    <p><strong>Identifiant unique :</strong> {entree.id}</p>
                    <p><strong>Date enregistrée :</strong> {entree.date}</p>
                    <p><strong>Montant encaissé :</strong> {entree.montant} €</p>
                    <p><strong>Description complète / Origine :</strong></p>
                    <p>{entree.description}</p>
                </section>
            </div>
        </aside>
    );
}

export default EntreePane;