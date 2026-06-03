import { useState } from 'react';
import { Link } from 'react-router-dom';
import ModalAjoutProduit from './modalAjoutProduit';
import ModalAjoutCategorie from './modalAjoutCategorie';

function ListeProduits() {
    const [modalProduitOuvert, setModalProduitOuvert] = useState(false);
    const [modalCategorieOuvert, setModalCategorieOuvert] = useState(false);

    // Données factices pour structurer le HTML-LIKE
    const produits = [
        { id: '1', nom: 'Produit A', disponibilite: 'En stock' },
        { id: '2', nom: 'Produit B', disponibilite: 'En rupture de stock' }
    ];

    return (
        <div>
            <section>
                <input 
                    type="search" 
                    placeholder="Rechercher un produit..." 
                />
                <button onClick={() => setModalProduitOuvert(true)}>
                    Ajouter un nouveau produit
                </button>
                <button onClick={() => setModalCategorieOuvert(true)}>
                    Ajouter une catégorie
                </button>
            </section>

            <ul>
                {produits.map((produit) => (
                    <li key={produit.id}>
                        <Link to={`/application/produit/${produit.id}`}>
                            <span>{produit.nom}</span>
                            <span>{produit.disponibilite}</span>
                        </Link>
                    </li>
                ))}
            </ul>

            {modalProduitOuvert && (
                <ModalAjoutProduit onClose={() => setModalProduitOuvert(false)} />
            )}
            {modalCategorieOuvert && (
                <ModalAjoutCategorie onClose={() => setModalCategorieOuvert(false)} />
            )}
        </div>
    );
}

export default ListeProduits;