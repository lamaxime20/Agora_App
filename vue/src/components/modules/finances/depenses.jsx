import { useState } from "react";
import { PlusCircle, History } from "lucide-react";
import EnregistrerDepense from "./depenses/enregistrerDepense.jsx";
import HistoriqueDepenses from "./depenses/historiqueDepenses.jsx";
import "../../../assets/styles/components/modules/finances/depenses.css";

const TABS = [
    { id: "enregistrer", label: "Enregistrer une dépense", icon: PlusCircle },
    { id: "historique",  label: "Historique des dépenses", icon: History },
];

function Depenses() {
    const [onglet, setOnglet] = useState("enregistrer");

    return (
        <div className="finDep-root">
            <header className="finDep-header">
                <h1 className="finDep-header__title">Dépenses</h1>
            </header>

            <nav className="finCommandes-tabs" aria-label="Sous-onglets dépenses">
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
                    <EnregistrerDepense />
                ) : (
                    <HistoriqueDepenses />
                )}
            </main>
        </div>
    );
}

export default Depenses;
