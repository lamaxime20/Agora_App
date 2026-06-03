import { useState } from "react";
import { Package, ClipboardList } from "lucide-react";
import ListeProduits from "./produits/listeProduits.jsx";
import HistoriqueTransactions from "./produits/historiqueTransactions.jsx";
import "../../../assets/styles/components/modules/gestionStocks/produits.css";

function Produits() {
    const [vue, setVue] = useState("liste");

    return (
        <div className="produits-root">
            <div className="produits-tabs" role="tablist" aria-label="Vues du module Produits">
                <button
                    className={`produits-tab${vue === "liste" ? " produits-tab--active" : ""}`}
                    onClick={() => setVue("liste")}
                    role="tab"
                    aria-selected={vue === "liste"}
                    type="button"
                >
                    <Package size={16} aria-hidden="true" />
                    Produits
                </button>
                <button
                    className={`produits-tab${vue === "historique" ? " produits-tab--active" : ""}`}
                    onClick={() => setVue("historique")}
                    role="tab"
                    aria-selected={vue === "historique"}
                    type="button"
                >
                    <ClipboardList size={16} aria-hidden="true" />
                    Historique
                </button>
            </div>

            <div className="produits-content" role="tabpanel">
                {vue === "liste"
                    ? <ListeProduits />
                    : <HistoriqueTransactions />
                }
            </div>
        </div>
    );
}

export default Produits;
