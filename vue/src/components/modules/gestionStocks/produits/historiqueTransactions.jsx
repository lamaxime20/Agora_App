import { useState, useEffect } from "react";
import { Search, TrendingUp, TrendingDown, Truck, PackagePlus, ClipboardList, FileText } from "lucide-react";
import PaneDetailsTransaction from "./paneDetailsTransaction.jsx";
import transactionsData from "../../../../mockups/gestionStocks/transactions.json";
import "../../../../assets/styles/components/modules/gestionStocks/historiqueTransactions.css";

const typeConfig = {
    ravitaillement: { label: "Ravitaillement", icon: TrendingUp,   mod: "ravitaillement" },
    perte:          { label: "Perte",           icon: TrendingDown, mod: "perte"          },
    livraison:      { label: "Livraison",       icon: Truck,        mod: "livraison"      },
    ajout:          { label: "Ajout",           icon: PackagePlus,  mod: "ajout"          },
};

function TypeIcon({ type }) {
    const cfg  = typeConfig[type] ?? typeConfig.ajout;
    const Icon = cfg.icon;
    return (
        <span className={`historiqueTransactions-type-icon historiqueTransactions-type-icon--${cfg.mod}`}>
            <Icon size={16} aria-hidden="true" />
        </span>
    );
}

function formatDate(iso) {
    return new Date(iso).toLocaleString("fr-FR", {
        day:    "2-digit",
        month:  "short",
        year:   "numeric",
        hour:   "2-digit",
        minute: "2-digit",
    });
}

function SkeletonRow() {
    return (
        <div className="historiqueTransactions-card" aria-hidden="true" style={{ pointerEvents: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--color-surface-alt)" }} />
            <div className="historiqueTransactions-card__body">
                <div className="skeleton-line skeleton-line--lg" />
                <div className="skeleton-line skeleton-line--sm" />
            </div>
            <div style={{ width: 40, height: 14, borderRadius: 4, background: "var(--color-surface-alt)" }} />
        </div>
    );
}

function HistoriqueTransactions() {
    const [transactions, setTransactions]   = useState([]);
    const [loading, setLoading]             = useState(true);
    const [recherche, setRecherche]         = useState("");
    const [filtreType, setFiltreType]       = useState("");
    const [dateDebut, setDateDebut]         = useState("");
    const [dateFin, setDateFin]             = useState("");
    const [selected, setSelected]           = useState(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setTransactions(transactionsData.data.transactions);
            setLoading(false);
        }, 600);
        return () => clearTimeout(t);
    }, []);

    const filtrees = transactions.filter(txn => {
        const q = recherche.toLowerCase();
        const matchSearch =
            txn.produit.nom.toLowerCase().includes(q) ||
            txn.produit.reference.toLowerCase().includes(q) ||
            txn.utilisateur.nom.toLowerCase().includes(q);
        const matchType  = !filtreType || txn.type === filtreType;
        const matchDebut = !dateDebut  || new Date(txn.date) >= new Date(dateDebut);
        const matchFin   = !dateFin    || new Date(txn.date) <= new Date(dateFin + "T23:59:59");
        return matchSearch && matchType && matchDebut && matchFin;
    });

    return (
        <div className="historiqueTransactions-root">
            {/* Filtres */}
            <div className="historiqueTransactions-filters">
                <div className="historiqueTransactions-filters__row">
                    <div className="historiqueTransactions-search" role="search">
                        <Search size={16} className="historiqueTransactions-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="historiqueTransactions-search__input app-input"
                            placeholder="Rechercher un produit, un utilisateur…"
                            aria-label="Rechercher"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                        />
                    </div>
                    <select
                        className="historiqueTransactions-select"
                        value={filtreType}
                        onChange={e => setFiltreType(e.target.value)}
                        aria-label="Filtrer par type"
                    >
                        <option value="">Tous les types</option>
                        <option value="ravitaillement">Ravitaillement</option>
                        <option value="perte">Perte</option>
                        <option value="livraison">Livraison</option>
                        <option value="ajout">Ajout produit</option>
                    </select>
                </div>

                <div className="historiqueTransactions-filters__row">
                    <input
                        type="date"
                        className="historiqueTransactions-date"
                        aria-label="Date de début"
                        value={dateDebut}
                        onChange={e => setDateDebut(e.target.value)}
                    />
                    <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>au</span>
                    <input
                        type="date"
                        className="historiqueTransactions-date"
                        aria-label="Date de fin"
                        value={dateFin}
                        onChange={e => setDateFin(e.target.value)}
                    />

                    <div className="historiqueTransactions-exports" style={{ marginLeft: "auto" }}>
                        <span className="historiqueTransactions-exports__label">Exporter :</span>
                        {["PDF", "CSV", "DOCX"].map(fmt => (
                            <button
                                key={fmt}
                                className="historiqueTransactions-export-btn"
                                type="button"
                                aria-label={`Exporter en ${fmt}`}
                            >
                                <FileText size={12} aria-hidden="true" />
                                {fmt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Layout principal */}
            <div className="historiqueTransactions-layout">
                <div className="historiqueTransactions-layout__main">

                    {loading && (
                        <div className="historiqueTransactions-list" aria-busy="true">
                            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                        </div>
                    )}

                    {!loading && filtrees.length === 0 && (
                        <div className="historiqueTransactions-empty">
                            <ClipboardList size={40} color="var(--color-text-light)" aria-hidden="true" />
                            <p>Aucune transaction trouvée pour ces filtres.</p>
                        </div>
                    )}

                    {!loading && filtrees.length > 0 && (
                        <>
                            {/* Mobile : cartes */}
                            <ul className="historiqueTransactions-list" aria-label="Liste des transactions">
                                {filtrees.map(txn => {
                                    const isPlus = (txn.variation ?? 0) > 0;
                                    return (
                                        <li key={txn.id}>
                                            <button
                                                className="historiqueTransactions-card"
                                                onClick={() => setSelected(txn)}
                                                type="button"
                                                aria-label={`Voir les détails : ${typeConfig[txn.type]?.label ?? txn.type} — ${txn.produit.nom}`}
                                            >
                                                <TypeIcon type={txn.type} />
                                                <div className="historiqueTransactions-card__body">
                                                    <span className="historiqueTransactions-card__produit">
                                                        {txn.produit.nom}
                                                    </span>
                                                    <span className="historiqueTransactions-card__meta">
                                                        {typeConfig[txn.type]?.label ?? txn.type} · {formatDate(txn.date)} · {txn.utilisateur.nom}
                                                    </span>
                                                </div>
                                                <span className={`historiqueTransactions-card__variation historiqueTransactions-card__variation--${isPlus ? "plus" : "minus"}`}>
                                                    {isPlus ? "+" : ""}{txn.variation}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Desktop : tableau */}
                            <div className="historiqueTransactions-table-wrap">
                                <table className="historiqueTransactions-table" aria-label="Historique des transactions">
                                    <thead>
                                        <tr>
                                            <th scope="col">Type</th>
                                            <th scope="col">Produit</th>
                                            <th scope="col">Utilisateur</th>
                                            <th scope="col">Date</th>
                                            <th scope="col">Variation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtrees.map(txn => {
                                            const isPlus = (txn.variation ?? 0) > 0;
                                            return (
                                                <tr
                                                    key={txn.id}
                                                    className="historiqueTransactions-table__row"
                                                    onClick={() => setSelected(txn)}
                                                    tabIndex={0}
                                                    onKeyDown={e => e.key === "Enter" && setSelected(txn)}
                                                    aria-label={`Détails : ${txn.produit.nom}`}
                                                >
                                                    <td>
                                                        <div className="historiqueTransactions-table__type">
                                                            <TypeIcon type={txn.type} />
                                                            <span>{typeConfig[txn.type]?.label ?? txn.type}</span>
                                                        </div>
                                                    </td>
                                                    <td>{txn.produit.nom}</td>
                                                    <td>{txn.utilisateur.nom}</td>
                                                    <td>{formatDate(txn.date)}</td>
                                                    <td>
                                                        <span className={`historiqueTransactions-card__variation historiqueTransactions-card__variation--${isPlus ? "plus" : "minus"}`}>
                                                            {isPlus ? "+" : ""}{txn.variation}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Pane latéral */}
                {selected && (
                    <PaneDetailsTransaction
                        transaction={selected}
                        onClose={() => setSelected(null)}
                    />
                )}
            </div>
        </div>
    );
}

export default HistoriqueTransactions;
