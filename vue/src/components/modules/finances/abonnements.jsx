import { useState } from "react";
import { Repeat, History } from "lucide-react";
import AbonnementsEnCours from "./abonnements/abonnementsEnCours.jsx";
import HistoriqueAbonnements from "./abonnements/historiqueAbonnements.jsx";
import "../../../assets/styles/components/modules/finances/abonnements.css";

const TABS = [
    { id: "encours",    label: "Abonnements en cours", icon: Repeat },
    { id: "historique", label: "Historique",           icon: History },
];

function Abonnements() {
    const [onglet, setOnglet] = useState("encours");

    return (
        <div className="finAbo-root">
            <header className="finAbo-header">
                <h1 className="finAbo-header__title">Abonnements</h1>
            </header>

            <nav className="finCommandes-tabs" aria-label="Sous-onglets abonnements">
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
                {onglet === "encours" ? (
                    <AbonnementsEnCours />
                ) : (
                    <HistoriqueAbonnements />
                )}
            </main>
        </div>
    );
}

export default Abonnements;
