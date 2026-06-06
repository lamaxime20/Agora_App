import { useState } from "react";
import { ArrowLeft, Download, ChevronDown, X } from "lucide-react";

const MOCK_PAIEMENTS = {
    "EMP-001": [
        { id: "PAY-2026-05-001", date: "2026-05-28", montant: 250000, mode: "virement bancaire", reference: "VIR-5501", periode: "Mai 2026" },
        { id: "PAY-2026-04-001", date: "2026-04-28", montant: 250000, mode: "virement bancaire", reference: "VIR-4401", periode: "Avril 2026" },
    ],
    "EMP-002": [
        { id: "PAY-2026-05-002", date: "2026-05-28", montant: 380000, mode: "virement bancaire", reference: "VIR-5502", periode: "Mai 2026" },
        { id: "PAY-2026-04-002", date: "2026-04-28", montant: 380000, mode: "virement bancaire", reference: "VIR-4402", periode: "Avril 2026" },
    ],
    "EMP-003": [
        { id: "PAY-2026-05-003", date: "2026-05-28", montant: 520000, mode: "virement bancaire", reference: "VIR-5503", periode: "Mai 2026" },
        { id: "PAY-2026-04-003", date: "2026-04-28", montant: 520000, mode: "virement bancaire", reference: "VIR-4403", periode: "Avril 2026" },
    ],
    "EMP-004": [
        { id: "PAY-2026-05-004", date: "2026-05-28", montant: 430000, mode: "virement bancaire", reference: "VIR-5504", periode: "Mai 2026" },
    ],
    "EMP-005": [
        { id: "PAY-2026-05-005", date: "2026-05-28", montant: 310000, mode: "virement bancaire", reference: "VIR-5505", periode: "Mai 2026" },
    ],
};

function HistoriquePaiementsSalarie({ salarie, onBack }) {
    const [filtreDate, setFiltreDate] = useState("");
    const [exportOpen, setExportOpen] = useState(false);
    const [selectedPay, setSelectedPay] = useState(null);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));

    const paiements = MOCK_PAIEMENTS[salarie.id] || [];

    const filtres = paiements.filter(p =>
        filtreDate ? p.date === filtreDate : true
    );

    const totalVerse = filtres.reduce((s, p) => s + p.montant, 0);

    function getInitiales(nom) {
        return nom.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
    }

    return (
        <>
            {/* Header avec retour */}
            <header className="finSal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                    <button className="finSal-back-btn" onClick={onBack} type="button" aria-label="Retour à la liste">
                        <ArrowLeft size={16} aria-hidden="true" />
                        Retour
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <div className="finSal-avatar" aria-hidden="true">
                            {getInitiales(salarie.nom)}
                        </div>
                        <div>
                            <h1 className="finSal-header__title">{salarie.nom}</h1>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>{salarie.poste}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* KPIs */}
            <div className="finSal-kpis" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="finSal-kpi">
                    <p className="finSal-kpi__label">Paiements</p>
                    <p className="finSal-kpi__value">{filtres.length}</p>
                </div>
                <div className="finSal-kpi">
                    <p className="finSal-kpi__label">Total versé</p>
                    <p className="finSal-kpi__value finSal-kpi__value--error">{formatMontant(totalVerse)}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="finSal-toolbar">
                <div className="finSal-toolbar__row">
                    <input
                        type="date"
                        className="finSal-filter-select"
                        value={filtreDate}
                        onChange={e => setFiltreDate(e.target.value)}
                        aria-label="Filtrer par date"
                    />

                    <div style={{ position: "relative", marginLeft: "auto" }}>
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => setExportOpen(!exportOpen)}
                            type="button"
                            aria-expanded={exportOpen}
                        >
                            <Download size={16} aria-hidden="true" />
                            Exporter
                            <ChevronDown size={14} aria-hidden="true" />
                        </button>
                        {exportOpen && (
                            <div className="finCommandes-export-menu" role="menu">
                                {[".csv", ".pdf", ".docx"].map(fmt => (
                                    <button
                                        key={fmt}
                                        className="finCommandes-export-menu__item"
                                        onClick={() => setExportOpen(false)}
                                        role="menuitem"
                                        type="button"
                                    >
                                        {fmt.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tableau desktop */}
            <div className="finSal-tableWrap">
                <table className="finSal-table" aria-label={`Historique des paiements de ${salarie.nom}`}>
                    <thead className="finSal-table__head">
                        <tr>
                            <th scope="col">Référence</th>
                            <th scope="col">Période</th>
                            <th scope="col">Date de versement</th>
                            <th scope="col">Montant net</th>
                            <th scope="col">Mode</th>
                            <th scope="col">Transaction</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtres.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                                    Aucun paiement trouvé pour ce salarié.
                                </td>
                            </tr>
                        ) : (
                            filtres.map(p => (
                                <tr key={p.id} className="finSal-table__row" style={{ cursor: "pointer" }} onClick={() => setSelectedPay(p)}>
                                    <td className="finSal-table__id">{p.id}</td>
                                    <td style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)" }}>{p.periode}</td>
                                    <td className="finSal-table__date">{formatDate(p.date)}</td>
                                    <td className="finSal-table__amount">{formatMontant(p.montant)}</td>
                                    <td>
                                        <span className="fin-badge fin-badge--info">{p.mode}</span>
                                    </td>
                                    <td className="finSal-table__id">{p.reference}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finSal-cards">
                {filtres.map(p => (
                    <article key={p.id} className="finSal-card" onClick={() => setSelectedPay(p)}>
                        <div className="finSal-card__top">
                            <span className="finSal-card__id">{p.id}</span>
                            <span className="fin-badge fin-badge--info">{p.mode}</span>
                        </div>
                        <p className="finSal-card__name">{p.periode}</p>
                        <div className="finSal-card__meta">
                            <span className="finSal-card__amount">{formatMontant(p.montant)}</span>
                            <span className="finSal-card__date">{formatDate(p.date)}</span>
                        </div>
                    </article>
                ))}
            </div>

            {/* Drawer détail paiement */}
            {selectedPay && (
                <>
                    <div className="finSal-drawer__overlay" onClick={() => setSelectedPay(null)} aria-hidden="true" />
                    <aside
                        className="finSal-drawer"
                        role="complementary"
                        aria-label={`Détails du paiement ${selectedPay.id}`}
                    >
                        <div className="finSal-drawer__handle">
                            <div className="finSal-drawer__handle-bar" />
                        </div>
                        <div className="finSal-drawer__header">
                            <h2 className="finSal-drawer__title">Paiement {selectedPay.id}</h2>
                            <button
                                className="finSal-drawer__close"
                                onClick={() => setSelectedPay(null)}
                                aria-label="Fermer"
                                type="button"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="finSal-drawer__body">
                            <section>
                                <p className="finSal-detail__section-label">Détails du versement</p>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">Période</span>
                                    <span className="finSal-detail__val">{selectedPay.periode}</span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">Date de versement</span>
                                    <span className="finSal-detail__val">{formatDate(selectedPay.date)}</span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">Montant net versé</span>
                                    <span className="finSal-detail__val finSal-detail__val--amount" style={{ color: "var(--color-error)" }}>
                                        {formatMontant(selectedPay.montant)}
                                    </span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">Mode de paiement</span>
                                    <span className="finSal-detail__val">
                                        <span className="fin-badge fin-badge--info">{selectedPay.mode}</span>
                                    </span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">Référence de transaction</span>
                                    <span className="finSal-detail__val">{selectedPay.reference}</span>
                                </div>
                            </section>
                            <section>
                                <p className="finSal-detail__section-label">Salarié</p>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">Nom</span>
                                    <span className="finSal-detail__val">{salarie.nom}</span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">Poste</span>
                                    <span className="finSal-detail__val">{salarie.poste}</span>
                                </div>
                            </section>
                        </div>
                        <div className="finSal-drawer__footer">
                            <button
                                className="app-button app-button--ghost"
                                style={{ width: "100%" }}
                                onClick={() => setSelectedPay(null)}
                                type="button"
                            >
                                Fermer
                            </button>
                        </div>
                    </aside>
                </>
            )}
        </>
    );
}

export default HistoriquePaiementsSalarie;
