function PaneDetailsPerte({ perte, onClose, onAnnulerLoss }) {
    return (
        <aside>
            <header>
                <h2>Détails complets de la perte</h2>
                <button onClick={onClose}>Fermer le volet</button>
            </header>

            <div>
                <p><strong>Identifiant Événement :</strong> #{perte.id}</p>
                <p><strong>Date d'enregistrement :</strong> {perte.date}</p>
                <p><strong>Produit impacté :</strong> {perte.produit}</p>
                <p><strong>Quantité soustraite :</strong> {perte.quantite} unité(s)</p>
                <p><strong>Raison déclarée :</strong> {perte.raison}</p>
                <p><strong>Valeur financière estimée :</strong> {perte.valeurEstimee}</p>
                
                {perte.moinsDe24h && (
                    <footer>
                        <button onClick={onAnnulerLoss}>
                            Annuler cette perte
                        </button>
                    </footer>
                )}
            </div>
        </aside>
    );
}

export default PaneDetailsPerte;