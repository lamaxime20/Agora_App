function ModalSignalerPerte({ onClose }) {
    return (
        <dialog open>
            <article>
                <header>
                    <h2>Signaler une perte</h2>
                    <button onClick={onClose}>Fermer</button>
                </header>

                <form>
                    <label>
                        Sélection du produit :
                        <input type="text" list="produits-perte-list" placeholder="Rechercher pour filtrer..." required />
                        <datalist id="produits-perte-list">
                            <option value="Produit Physique X" />
                            <option value="Produit Physique Y" />
                        </datalist>
                    </label>

                    <label>
                        Nombre d'items perdus :
                        <input type="number" min="1" required />
                    </label>

                    <label>
                        Raison de la perte :
                        <textarea placeholder="Indiquer la raison (vol, casse, péremption...)" required></textarea>
                    </label>

                    <footer>
                        <button type="submit">Confirmer la perte</button>
                    </footer>
                </form>
            </article>
        </dialog>
    );
}

export default ModalSignalerPerte;