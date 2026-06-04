import { useState } from "react";
import { RefreshCw, History } from "lucide-react";
import ListeReapprovisionnement from "./reapprovisionnements/listeReapprovisionnement.jsx";
import HistoriqueReapprovisionnement from "./reapprovisionnements/historiqueReapprovisionnement.jsx";
import "../../../assets/styles/components/modules/gestionStocks/reapprovisionnement.css";

const ONGLETS = [
    { id: "liste",      label: "Réapprovisionnements", Icon: RefreshCw },
    { id: "historique", label: "Historique",            Icon: History   },
];

function Reapprovisionnement() {
    const [onglet, setOnglet] = useState("liste");

    return (
        <div className="reappro-root">
            <nav className="reappro-tabs" role="tablist" aria-label="Navigation réapprovisionnement">
                {ONGLETS.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        role="tab"
                        aria-selected={onglet === id}
                        className={`reappro-tab${onglet === id ? " reappro-tab--active" : ""}`}
                        onClick={() => setOnglet(id)}
                        type="button"
                    >
                        <Icon size={16} aria-hidden="true" />
                        {label}
                    </button>
                ))}
            </nav>

            <div className="reappro-panel" role="tabpanel">
                {onglet === "liste"      && <ListeReapprovisionnement />}
                {onglet === "historique" && <HistoriqueReapprovisionnement />}
            </div>
        </div>
    );
}

export default Reapprovisionnement;
