function ModalAnnulerReapprovisionnement({ item, onClose }) {
    return (
        <dialog open>
            <article>
                <header>
                    <h2>Annuler le réapprovisionnement</h2>
                    <button onClick={onClose}>Fermer</button>
                </header>

                <form>
                    <p>Vous êtes sur le point d'annuler le réapprovisionnement de : <strong>{item.produit}</strong></p>
                    
                    <label>
                        Raison de l'annulation :
                        <textarea name="raison_annulation" required placeholder="Veuillez indiquer le motif de l'annulation..."></textarea>
                    </label>

                    <footer>
                        <button type="submit">Confirmer l'annulation</button>
                    </footer>
                </form>
            </article>
        </dialog>
    );
}

export default ModalAnnulerReapprovisionnement;