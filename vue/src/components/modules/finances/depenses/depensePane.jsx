function DepensePane({ depense, onClose }) {
    return (
        <aside>
            <div>
                <button onClick={onClose}>Fermer le volet</button>
                
                <h3>Détails complets de la dépense</h3>
                
                <section>
                    <p><strong>Identifiant unique :</strong> {depense.id}</p>
                    <p><strong>Date enregistrée :</strong> {depense.date}</p>
                    <p><strong>Montant prélevé :</strong> {depense.montant} €</p>
                    <p><strong>Description complète / Justification :</strong></p>
                    <p>{depense.description}</p>
                </section>
            </div>
        </aside>
    );
}

export default DepensePane;