import { useState } from "react";
import HistoriquePaiementsSalarie from "./historiquePaiementsSalarie.jsx";

function ListeSalaries() {
    const [vue, setVue] = useState("liste"); // "liste" ou "historique"
    const [salarieSelectionne, setSalarieSelectionne] = useState(null);

    const handleVoirHistorique = (salarie) => {
        setSalarieSelectionne(salarie);
        setVue("historique");
    };

    if (vue === "historique") {
        return <HistoriquePaiementsSalarie salarie={salarieSelectionne} onBack={() => setVue("liste")} />;
    }

    return (
        <div>
            <header>
                <h1>Salariés</h1>
            </header>
            <ul>
                {/* La liste des salariés sera mappée ici */}
                <li>Salarie 1... <button onClick={() => handleVoirHistorique({ nom: "Salarie 1" })}>Voir historique</button></li>
            </ul>
        </div>
    );
}

export default ListeSalaries;