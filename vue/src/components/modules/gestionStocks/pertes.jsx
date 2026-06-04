import { useState } from "react";
import { AlertTriangle, History } from "lucide-react";
import ListePertes       from "./pertes/listePertes.jsx";
import HistoriquePertes  from "./pertes/historiquePertes.jsx";
import "../../../assets/styles/components/modules/gestionStocks/pertes.css";

const ONGLETS = [
    { id: "liste",      label: "Pertes en cours",  Icon: AlertTriangle },
    { id: "historique", label: "Historique",        Icon: History       },
];

function Pertes() {
    const [onglet, setOnglet] = useState("liste");

    return (
        <div className="pertes-root">
            <nav className="pertes-tabs" role="tablist" aria-label="Navigation pertes">
                {ONGLETS.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        role="tab"
                        aria-selected={onglet === id}
                        className={`pertes-tab${onglet === id ? " pertes-tab--active" : ""}`}
                        onClick={() => setOnglet(id)}
                        type="button"
                    >
                        <Icon size={16} aria-hidden="true" />
                        {label}
                    </button>
                ))}
            </nav>

            <div className="pertes-panel" role="tabpanel">
                {onglet === "liste"      && <ListePertes />}
                {onglet === "historique" && <HistoriquePertes />}
            </div>
        </div>
    );
}

export default Pertes;
