import { useState } from "react";
import { PlusCircle, History } from "lucide-react";
import EnregistrerEntree from "./entree/enregistrerEntree.jsx";
import HistoriqueEntrees from "./entree/historiqueEntrees.jsx";
import "../../../assets/styles/components/modules/finances/entree.css";

const TABS = [
    { id: "enregistrer", label: "Enregistrer une entrée", icon: PlusCircle },
    { id: "historique",  label: "Historique des entrées", icon: History },
];

function Entree() {
    const [onglet, setOnglet] = useState("enregistrer");

    return (
        <div className="finEnt-root">
            <header className="finEnt-header">
                <h1 className="finEnt-header__title">Entrées financières</h1>
            </header>

            <nav className="finCommandes-tabs" aria-label="Sous-onglets entrées">
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
                    <EnregistrerEntree />
                ) : (
                    <HistoriqueEntrees />
                )}
            </main>
        </div>
    );
}

export default Entree;
