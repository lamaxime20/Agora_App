import { useState } from "react";
import CommandesEnAttente from "./commandes/commandesEnAttente.jsx";
import HistoriquePaiements from "./commandes/historiquePaiements.jsx";

function Commandes() {
    const [sousOnglet, setSousOnglet] = useState("attente"); // "attente" ou "historique"

    return (
        <div>
            <header>
                <nav>
                    <button onClick={() => setSousOnglet("attente")}>
                        Commandes en attente de payement complet
                    </button>
                    <button onClick={() => setSousOnglet("historique")}>
                        Historique des payements
                    </button>
                </nav>
            </header>

            <main>
                {sousOnglet === "attente" ? (
                    <CommandesEnAttente />
                ) : (
                    <HistoriquePaiements />
                )}
            </main>
        </div>
    );
}

export default Commandes;