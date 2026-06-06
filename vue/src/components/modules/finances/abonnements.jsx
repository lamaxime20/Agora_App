import { useState } from "react";
import AbonnementsEnCours from "./abonnements/abonnementsEnCours.jsx";
import HistoriqueAbonnements from "./abonnements/historiqueAbonnements.jsx";

function Abonnements() {
    const [sousOnglet, setSousOnglet] = useState("encours"); // "encours" ou "historique"

    return (
        <div>
            <header>
                <nav>
                    <button onClick={() => setSousOnglet("encours")}>
                        Abonnement en cours
                    </button>
                    <button onClick={() => setSousOnglet("historique")}>
                        Historique des abonnements
                    </button>
                </nav>
            </header>

            <main>
                {sousOnglet === "encours" ? (
                    <AbonnementsEnCours />
                ) : (
                    <HistoriqueAbonnements />
                )}
            </main>
        </div>
    );
}

export default Abonnements;