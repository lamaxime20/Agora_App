function DetailsCommandeModal({ commande, onClose }) {
    return (
        <dialog open>
            <div>
                <h3>Toutes les informations de la commande associée</h3>
                
                <section>
                    <p><strong>Identifiant Unique de la commande :</strong> {commande.id}</p>
                    <p><strong>Libellé / Client :</strong> {commande.nom}</p>
                    <p><strong>Montant global facturé :</strong> {commande.total} €</p>
                </section>

                <button onClick={onClose}>Fermer la vue commande</button>
            </div>
        </dialog>
    );
}

export default DetailsCommandeModal;