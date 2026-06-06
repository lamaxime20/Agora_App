import { useState } from "react";
import EnregistrerEntree from "./entree/enregistrerEntree.jsx";
import HistoriqueEntrees from "./entree/historiqueEntrees.jsx";

function Entree() {
    const [sousOnglet, setSousOnglet] = useState("enregistrer"); // "enregistrer" ou "historique"

    return (
        <div>
            <header>
                <nav>
                    <button onClick={() => setSousOnglet("enregistrer")}>
                        Enregistrer une entrée
                    </button>
                    <button onClick={() => setSousOnglet("historique")}>
                        Historique des entrées
                    </button>
                </nav>
            </header>

            <main>
                {sousOnglet === "enregistrer" ? (
                    <EnregistrerEntree />
                ) : (
                    <HistoriqueEntrees />
                )}
            </main>
        </div>
    );
}

export default Entree;