function ModalAnnulerPerte({ perte, onClose }) {
    return (
        <dialog open>
            <article>
                <header>
                    <h2>Confirmer l'annulation de la perte</h2>
                    <button onClick={onClose}>Fermer</button>
                </header>

                <form>
                    <p>Vous demandez l'annulation de la perte de {perte.quantite} item(s) pour : <strong>{perte.produit}</strong></p>
                    
                    <label>
                        Veuillez entrer votre mot de passe utilisateur :
                        <input type="password" required placeholder="Mot de passe requis" />
                    </label>

                    <footer>
                        <button type="submit">Confirmer l'annulation</button>
                    </footer>
                </form>
            </article>
        </dialog>
    );
}

export default ModalAnnulerPerte;