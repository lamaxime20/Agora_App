import { useState } from 'react';

import ListeProduitsAdmin    from '../../components/admin/produits/listeProduits';
import ListeCategoriesAdmin  from '../../components/admin/produits/listeCategories';

import {
    ADMIN_PRODUIT_PRODUIT,
    ADMIN_PRODUIT_CATEGORIE,
    getADMIN_PRODUIT_LOCALSTORAGE,
    setADMIN_PRODUIT_LOCALSTORAGE,
} from '../../services/admin/produits';

import '../../assets/styles/pages/admin/produits.css';

function ProduitsAdmin() {
    const [onglet, setOnglet] = useState(getADMIN_PRODUIT_LOCALSTORAGE);

    const changeOnglet = (nouvelOnglet) => {
        setOnglet(nouvelOnglet);
        setADMIN_PRODUIT_LOCALSTORAGE(nouvelOnglet);
    };

    return (
        <div className="produitsAdmin-root">
            <div className="produitsAdmin-segmented" role="tablist" aria-label="Sections produits">
                <button
                    type="button"
                    role="tab"
                    aria-selected={onglet === ADMIN_PRODUIT_PRODUIT}
                    className={`produitsAdmin-segmented__btn${onglet === ADMIN_PRODUIT_PRODUIT ? ' produitsAdmin-segmented__btn--active' : ''}`}
                    onClick={() => changeOnglet(ADMIN_PRODUIT_PRODUIT)}
                >
                    Produits
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={onglet === ADMIN_PRODUIT_CATEGORIE}
                    className={`produitsAdmin-segmented__btn${onglet === ADMIN_PRODUIT_CATEGORIE ? ' produitsAdmin-segmented__btn--active' : ''}`}
                    onClick={() => changeOnglet(ADMIN_PRODUIT_CATEGORIE)}
                >
                    Catégories
                </button>
            </div>

            <div className="produitsAdmin-panel" role="tabpanel">
                {onglet === ADMIN_PRODUIT_PRODUIT   && <ListeProduitsAdmin />}
                {onglet === ADMIN_PRODUIT_CATEGORIE && <ListeCategoriesAdmin />}
            </div>
        </div>
    );
}

export default ProduitsAdmin;
