function ModalAjoutCategorie({ onClose }) {
    return (
        <dialog open>
            <article>
                <header>
                    <h2>Ajouter une catégorie</h2>
                    <button onClick={onClose}>Fermer</button>
                </header>

                <form>
                    <label>
                        Nom de la catégorie :
                        <input type="text" name="nom_categorie" required />
                    </label>
                    
                    <label>
                        Description :
                        <textarea name="description_categorie"></textarea>
                    </label>

                    <footer>
                        <button type="submit">Enregistrer la catégorie</button>
                    </footer>
                </form>
            </article>
        </dialog>
    );
}

export default ModalAjoutCategorie;