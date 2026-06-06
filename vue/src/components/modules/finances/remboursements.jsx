import { useState } from "react";
import EnregistrerRemboursement from "./remboursements/enregistrerRemboursement.jsx";
import HistoriqueRemboursements from "./remboursements/historiqueRemboursements.jsx";

function Remboursements() {
    const [sousOnglet, setSousOnglet] = useState("enregistrer"); // "enregistrer" ou "historique"

    return (
        <div>
            <header>
                <nav>
                    <button onClick={() => setSousOnglet("enregistrer")}>
                        Enregistrer un remboursement
                    </button>
                    <button onClick={() => setSousOnglet("historique")}>
                        Historique des remboursements
                    </button>
                </nav>
            </header>

            <main>
                {sousOnglet === "enregistrer" ? (
                    <EnregistrerRemboursement />
                ) : (
                    <HistoriqueRemboursements />
                )}
            </main>
        </div>
    );
}

export default Remboursements;