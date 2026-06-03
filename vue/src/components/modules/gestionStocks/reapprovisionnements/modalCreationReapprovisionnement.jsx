function ModalCreationReapprovisionnement({ onClose }) {
    return (
        <dialog open>
            <article>
                <header>
                    <h2>Faire un réapprovisionnement</h2>
                    <button onClick={onClose}>Fermer</button>
                </header>

                <form>
                    <label>
                        Sélectionner le produit :
                        <input type="text" list="produits-reappro-list" required />
                        <datalist id="produits-reappro-list">
                            <option value="Produit A" />
                            <option value="Produit B" />
                        </datalist>
                    </label>

                    <label>
                        Nombre d'items à ravitailler :
                        <input type="number" min="1" required />
                    </label>

                    <label>
                        Montant total du ravitaillement :
                        <input type="number" min="0" step="0.01" required />
                    </label>

                    <footer>
                        <button type="submit">Demander le réapprovisionnement</button>
                    </footer>
                </form>
            </article>
        </dialog>
    );
}

export default ModalCreationReapprovisionnement;