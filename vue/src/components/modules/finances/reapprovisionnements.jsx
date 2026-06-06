import { useState } from "react";
import EnregistrerReapprovisionnement from "./reapprovisionnements/enregistrerReapprovisionnement.jsx";
import HistoriqueReapprovisionnements from "./reapprovisionnements/historiqueReapprovisionnements.jsx";

function Reapprovisionnements() {
    const [sousOnglet, setSousOnglet] = useState("enregistrer"); // "enregistrer" ou "historique"

    return (
        <div>
            <header>
                <nav>
                    <button onClick={() => setSousOnglet("enregistrer")}>
                        Nouvelle commande de réapprovisionnement
                    </button>
                    <button onClick={() => setSousOnglet("historique")}>
                        Historique des réapprovisionnements
                    </button>
                </nav>
            </header>

            <main>
                {sousOnglet === "enregistrer" ? (
                    <EnregistrerReapprovisionnement />
                ) : (
                    <HistoriqueReapprovisionnements />
                )}
            </main>
        </div>
    );
}

export default Reapprovisionnements;