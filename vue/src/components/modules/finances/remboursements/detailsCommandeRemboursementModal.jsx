function DetailsCommandeRemboursementModal({ commande, onClose }) {
    return (
        <dialog open>
            <div>
                <h3>Informations complètes de la commande</h3>
                
                <section>
                    <p><strong>Référence interne :</strong> {commande.id}</p>
                    <p><strong>Nom / Libellé de commande :</strong> {commande.nom}</p>
                    <p><strong>Montant total facturé à l'origine :</strong> {commande.totalFacture} €</p>
                    <p><strong>Montant total effectivement payé par le client :</strong> {commande.totalPaye} €</p>
                </section>

                <button onClick={onClose}>Fermer la vue commande</button>
            </div>
        </dialog>
    );
}

export default DetailsCommandeRemboursementModal;