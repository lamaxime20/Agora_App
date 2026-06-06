import { useState } from "react";
import { Search, Users } from "lucide-react";
import HistoriquePaiementsSalarie from "./historiquePaiementsSalarie.jsx";

const MOCK_SALARIES = [
    { id: "EMP-001", nom: "Alice Caisse",    poste: "Caissière",              salaireNet: 250000, statut: "Actif" },
    { id: "EMP-002", nom: "Jean Comptable",  poste: "Comptable principal",    salaireNet: 380000, statut: "Actif" },
    { id: "EMP-003", nom: "Marie Finance",   poste: "Responsable financière", salaireNet: 520000, statut: "Actif" },
    { id: "EMP-004", nom: "Paul Trésorerie", poste: "Trésorier",              salaireNet: 430000, statut: "Actif" },
    { id: "EMP-005", nom: "Sophie Logist.",  poste: "Responsable logistique", salaireNet: 310000, statut: "Congé" },
];

function getInitiales(nom) {
    return nom.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

function ListeSalaries() {
    const [vue, setVue]             = useState("liste");
    const [salarieSelectionne, setSalarieSelectionne] = useState(null);
    const [recherche, setRecherche] = useState("");

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const handleVoirHistorique = (salarie) => {
        setSalarieSelectionne(salarie);
        setVue("historique");
    };

    if (vue === "historique" && salarieSelectionne) {
        return (
            <HistoriquePaiementsSalarie
                salarie={salarieSelectionne}
                onBack={() => { setVue("liste"); setSalarieSelectionne(null); }}
            />
        );
    }

    const massesSalariale = MOCK_SALARIES.reduce((s, e) => s + e.salaireNet, 0);

    const filtres = MOCK_SALARIES.filter(e =>
        recherche
            ? e.nom.toLowerCase().includes(recherche.toLowerCase()) ||
              e.poste.toLowerCase().includes(recherche.toLowerCase()) ||
              e.id.toLowerCase().includes(recherche.toLowerCase())
            : true
    );

    return (
        <>
            <header className="finSal-header">
                <h1 className="finSal-header__title">Salariés</h1>
            </header>

            {/* KPIs */}
            <div className="finSal-kpis" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="finSal-kpi">
                    <p className="finSal-kpi__label">Effectif total</p>
                    <p className="finSal-kpi__value">{MOCK_SALARIES.length}</p>
                </div>
                <div className="finSal-kpi">
                    <p className="finSal-kpi__label">Masse salariale</p>
                    <p className="finSal-kpi__value finSal-kpi__value--error">{formatMontant(massesSalariale)}/mois</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="finSal-toolbar">
                <div className="finSal-toolbar__row">
                    <div className="finSal-search">
                        <Search size={16} className="finSal-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input finSal-search__input"
                            placeholder="Rechercher par nom, poste…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher un salarié"
                        />
                    </div>
                </div>
            </div>

            {/* Tableau desktop */}
            <div className="finSal-tableWrap">
                <table className="finSal-table" aria-label="Liste des salariés">
                    <thead className="finSal-table__head">
                        <tr>
                            <th scope="col">Salarié</th>
                            <th scope="col">Poste</th>
                            <th scope="col">Salaire net</th>
                            <th scope="col">Statut</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtres.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="finSal-empty">
                                        <div className="finSal-empty__icon">
                                            <Users size={32} aria-hidden="true" />
                                        </div>
                                        <p className="finSal-empty__title">Aucun salarié trouvé</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtres.map(emp => (
                                <tr key={emp.id} className="finSal-table__row">
                                    <td>
                                        <div className="finSal-employee-cell">
                                            <div className="finSal-avatar" aria-hidden="true">
                                                {getInitiales(emp.nom)}
                                            </div>
                                            <div className="finSal-employee-cell__info">
                                                <span className="finSal-employee-cell__name">{emp.nom}</span>
                                                <span className="finSal-employee-cell__role">{emp.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{emp.poste}</td>
                                    <td className="finSal-table__amount">{formatMontant(emp.salaireNet)}</td>
                                    <td>
                                        <span className={`fin-badge ${emp.statut === "Actif" ? "fin-badge--success" : "fin-badge--warning"}`}>
                                            {emp.statut}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="app-button app-button--ghost app-button--sm"
                                            onClick={() => handleVoirHistorique(emp)}
                                            type="button"
                                        >
                                            Historique
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finSal-cards">
                {filtres.length === 0 ? (
                    <div className="finSal-empty">
                        <div className="finSal-empty__icon"><Users size={32} aria-hidden="true" /></div>
                        <p className="finSal-empty__title">Aucun salarié trouvé</p>
                    </div>
                ) : (
                    filtres.map(emp => (
                        <article key={emp.id} className="finSal-card" onClick={() => handleVoirHistorique(emp)}>
                            <div className="finSal-card__top">
                                <span className="finSal-card__id">{emp.id}</span>
                                <span className={`fin-badge ${emp.statut === "Actif" ? "fin-badge--success" : "fin-badge--warning"}`}>
                                    {emp.statut}
                                </span>
                            </div>
                            <p className="finSal-card__name">{emp.nom}</p>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{emp.poste}</div>
                            <div className="finSal-card__meta">
                                <span className="finSal-card__amount">{formatMontant(emp.salaireNet)}/mois</span>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </>
    );
}

export default ListeSalaries;
