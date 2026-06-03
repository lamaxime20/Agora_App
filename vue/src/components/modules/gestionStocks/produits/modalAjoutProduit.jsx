import { useState } from 'react';

function ModalAjoutProduit({ onClose }) {
    const [typeProduit, setTypeProduit] = useState('physique');

    return (
        <dialog open>
            <article>
                <header>
                    <h2>Ajouter un nouveau produit</h2>
                    <button onClick={onClose}>Fermer</button>
                </header>

                <form>
                    <label>
                        Nom du produit :
                        <input type="text" name="nom" required />
                    </label>

                    <label>
                        Image du produit (Drag & Drop) :
                        <input type="file" accept="image/*" />
                    </label>

                    <label>
                        Prix unitaire :
                        <input type="number" name="prix_unitaire" min="0" required />
                    </label>

                    <fieldset>
                        <legend>Type de produit :</legend>
                        <label>
                            <input 
                                type="radio" 
                                name="type_produit" 
                                value="physique"
                                checked={typeProduit === 'physique'}
                                onChange={() => setTypeProduit('physique')}
                            />
                            Physique
                        </label>
                        <label>
                            <input 
                                type="radio" 
                                name="type_produit" 
                                value="service"
                                checked={typeProduit === 'service'}
                                onChange={() => setTypeProduit('service')}
                            />
                            Service
                        </label>
                    </fieldset>

                    {typeProduit === 'physique' && (
                        <div>
                            <label>
                                Stock actuel :
                                <input type="number" name="stock_actuel" required />
                            </label>
                            <label>
                                Seuil d'alerte de stock :
                                <input type="number" name="seuil_alerte" required />
                            </label>
                            <label>
                                Unité de mesure :
                                <input type="text" name="unite_mesure" required />
                            </label>
                        </div>
                    )}

                    <label>
                        Description :
                        <textarea name="description"></textarea>
                    </label>

                    <label>
                        Catégorie :
                        <input type="text" list="categories-list" name="categorie" placeholder="Sélectionner ou taper..." />
                        <datalist id="categories-list">
                            <option value="Électronique" />
                            <option value="Alimentation" />
                            <option value="Pas de catégorie enregistrée" />
                        </datalist>
                    </label>

                    <footer>
                        <button type="submit">Enregistrer le produit</button>
                    </footer>
                </form>
            </article>
        </dialog>
    );
}

export default ModalAjoutProduit;