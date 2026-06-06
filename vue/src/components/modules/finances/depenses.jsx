import { useState } from "react";
import EnregistrerDepense from "./depenses/enregistrerDepense.jsx";
import HistoriqueDepenses from "./depenses/historiqueDepenses.jsx";

function Depenses() {
    const [sousOnglet, setSousOnglet] = useState("enregistrer"); // "enregistrer" ou "historique"

    return (
        <div>
            <header>
                <nav>
                    <button onClick={() => setSousOnglet("enregistrer")}>
                        Enregistrer une dépense
                    </button>
                    <button onClick={() => setSousOnglet("historique")}>
                        Historique des dépenses
                    </button>
                </nav>
            </header>

            <main>
                {sousOnglet === "enregistrer" ? (
                    <EnregistrerDepense />
                ) : (
                    <HistoriqueDepenses />
                )}
            </main>
        </div>
    );
}

export default Depenses;