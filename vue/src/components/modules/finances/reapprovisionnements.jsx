import { useState } from "react";
import { Truck, History } from "lucide-react";
import EnregistrerReapprovisionnement from "./reapprovisionnements/enregistrerReapprovisionnement.jsx";
import HistoriqueReapprovisionnements from "./reapprovisionnements/historiqueReapprovisionnements.jsx";
import "../../../assets/styles/components/modules/finances/reapprovisionnements.css";

const TABS = [
    { id: "enregistrer", label: "Nouvelle commande",    icon: Truck },
    { id: "historique",  label: "Historique",           icon: History },
];

function Reapprovisionnements() {
    const [onglet, setOnglet] = useState("enregistrer");

    return (
        <div className="finReapp-root">
            <header className="finReapp-header">
                <h1 className="finReapp-header__title">Réapprovisionnements</h1>
            </header>

            <nav className="finCommandes-tabs" aria-label="Sous-onglets réapprovisionnements">
                {TABS.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            className={`finCommandes-tab${onglet === t.id ? " finCommandes-tab--active" : ""}`}
                            onClick={() => setOnglet(t.id)}
                            type="button"
                            aria-current={onglet === t.id ? "page" : undefined}
                        >
                            <Icon size={16} aria-hidden="true" />
                            {t.label}
                        </button>
                    );
                })}
            </nav>

            <main>
                {onglet === "enregistrer" ? (
                    <EnregistrerReapprovisionnement />
                ) : (
                    <HistoriqueReapprovisionnements />
                )}
            </main>
        </div>
    );
}

export default Reapprovisionnements;
