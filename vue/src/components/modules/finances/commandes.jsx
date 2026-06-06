import { useState } from "react";
import { CreditCard, History } from "lucide-react";
import CommandesEnAttente from "./commandes/commandesEnAttente.jsx";
import HistoriquePaiements from "./commandes/historiquePaiements.jsx";
import "../../../assets/styles/components/modules/finances/commandes.css";

function Commandes() {
    const [sousOnglet, setSousOnglet] = useState("attente");

    return (
        <section className="finCommandes-root">

            <header className="finCommandes-header">
                <div className="finCommandes-header__left">
                    <h1 className="finCommandes-header__title">Commandes</h1>
                    <p className="finCommandes-header__subtitle">Paiements et validation financière des commandes</p>
                </div>
            </header>

            <div className="finCommandes-tabs" role="tablist" aria-label="Sections des commandes">
                <button
                    role="tab"
                    className={`finCommandes-tab${sousOnglet === "attente" ? " finCommandes-tab--active" : ""}`}
                    onClick={() => setSousOnglet("attente")}
                    aria-selected={sousOnglet === "attente"}
                    type="button"
                >
                    <CreditCard size={16} aria-hidden="true" />
                    En attente
                </button>
                <button
                    role="tab"
                    className={`finCommandes-tab${sousOnglet === "historique" ? " finCommandes-tab--active" : ""}`}
                    onClick={() => setSousOnglet("historique")}
                    aria-selected={sousOnglet === "historique"}
                    type="button"
                >
                    <History size={16} aria-hidden="true" />
                    Historique
                </button>
            </div>

            <div role="tabpanel">
                {sousOnglet === "attente" ? (
                    <CommandesEnAttente />
                ) : (
                    <HistoriquePaiements />
                )}
            </div>

        </section>
    );
}

export default Commandes;
