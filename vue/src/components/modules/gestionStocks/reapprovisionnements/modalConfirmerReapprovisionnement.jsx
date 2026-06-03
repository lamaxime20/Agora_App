function ModalConfirmerReapprovisionnement({ item, onClose }) {
    return (
        <dialog open>
            <article>
                <header>
                    <h2>Confirmer le ravitaillement</h2>
                    <button onClick={onClose}>Fermer</button>
                </header>

                <form>
                    <p>Veuillez valider définitivement la réception du réapprovisionnement pour : <strong>{item.produit}</strong></p>
                    
                    <label>
                        Votre mot de passe :
                        <input type="password" name="mot_de_passe" required placeholder="Entrez votre mot de passe pour valider" />
                    </label>

                    <footer>
                        <button type="submit">Terminer et valider le ravitaillement</button>
                    </footer>
                </form>
            </article>
        </dialog>
    );
}

export default ModalConfirmerReapprovisionnement;