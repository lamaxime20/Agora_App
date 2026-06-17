import { useState } from "react"

import ListeProduitsAdmin from "../../components/admin/produits/listeProduits.jsx"
import ListeCategoriesAdmin from "../../components/admin/produits/listeCategories.jsx"

import { ADMIN_PRODUIT_PRODUIT, ADMIN_PRODUIT_CATEGORIE } from "../../services/admin/produits"

import { getADMIN_PRODUIT_LOCALSTORAGE, setADMIN_PRODUIT_LOCALSTORAGE } from "../../services/admin/produits"

function ProduitsAdmin () {
    const [onglet, setOnglet] = useState(getADMIN_PRODUIT_LOCALSTORAGE());

    const changeOnglet = (onglet) => {
        setOnglet(onglet);
        setADMIN_PRODUIT_LOCALSTORAGE(onglet);
    }

    return (
        <div className="produitsAdmin-root">
            <h1>Produits</h1>
            <div className="produitsAdmin-header">
                <button
                    className="produitsAdmin-btnProduit"
                    onClick={() => changeOnglet(ADMIN_PRODUIT_PRODUIT)}
                >
                    Produits
                </button>
                <button
                    className="produitsAdmin-btnCategorie"
                    onClick={() => changeOnglet(ADMIN_PRODUIT_CATEGORIE)}
                >
                    Catégories
                </button>
            </div>
            <div className="produitsAdmin-container">
                {onglet === ADMIN_PRODUIT_PRODUIT && <ListeProduitsAdmin />}
                {onglet === ADMIN_PRODUIT_CATEGORIE && <ListeCategoriesAdmin />}
            </div>
        </div>
    )
}

export default ProduitsAdmin;