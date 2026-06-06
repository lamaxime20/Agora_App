import { useState } from "react";
import { RotateCcw, History } from "lucide-react";
import EnregistrerRemboursement from "./remboursements/enregistrerRemboursement.jsx";
import HistoriqueRemboursements from "./remboursements/historiqueRemboursements.jsx";
import "../../../assets/styles/components/modules/finances/remboursements.css";

const TABS = [
    { id: "enregistrer", label: "Enregistrer un remboursement", icon: RotateCcw },
    { id: "historique",  label: "Historique des remboursements", icon: History },
];

function Remboursements() {
    const [onglet, setOnglet] = useState("enregistrer");

    return (
        <div className="finRemb-root">
            <header className="finRemb-header">
                <h1 className="finRemb-header__title">Remboursements</h1>
            </header>

            <nav className="finCommandes-tabs" aria-label="Sous-onglets remboursements">
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
                    <EnregistrerRemboursement />
                ) : (
                    <HistoriqueRemboursements />
                )}
            </main>
        </div>
    );
}

export default Remboursements;
