import { useState } from "react";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { exportRapport } from "../../../../services/exportService.js";

const PERIODS = [
    { key: "mensuel",    label: "Mensuel" },
    { key: "trimestriel", label: "Trimestriel" },
    { key: "semestriel", label: "Semestriel" },
    { key: "annuel",     label: "Annuel" },
];

const RAPPORTS = [
    { key: "tableau_bord",    label: "Tableau de bord financier",         desc: "Vue d'ensemble KPIs, flux et trésorerie" },
    { key: "grand_livre",     label: "Grand livre — Journal financier",   desc: "Tous les mouvements financiers horodatés" },
    { key: "bilan_salaires",  label: "Bilan de la masse salariale",       desc: "Détail salaires par employé et poste" },
    { key: "etat_tresorerie", label: "État de trésorerie",               desc: "Évolution du solde sur la période" },
    { key: "rapport_depenses",label: "Rapport des dépenses",             desc: "Dépenses opérationnelles par catégorie" },
    { key: "rapport_reappro", label: "Rapport réapprovisionnements",     desc: "Achats validés, refusés et engagés" },
];

const FORMATS = [
    { key: "pdf",  label: "PDF",  icon: File,            color: "#E74C3C" },
    { key: "xlsx", label: "XLSX", icon: FileSpreadsheet, color: "#27AE60" },
    { key: "csv",  label: "CSV",  icon: FileText,        color: "#3498DB" },
];

function Rapports() {
    const [period, setPeriod]     = useState("mensuel");
    const [exporting, setExporting] = useState(null);

    async function handleExport(rapport, format) {
        const key = `${rapport}-${format}`;
        if (exporting === key) return;
        setExporting(key);
        try {
            await exportRapport(format, rapport, period);
        } catch { /* silencieux */ } finally {
            setExporting(null);
        }
    }

    return (
        <div className="finStats-tab-content">
            {/* Sélecteur de période */}
            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Période des rapports</p>
                <div className="finStats-period-selector" role="group" aria-label="Période">
                    {PERIODS.map(p => (
                        <button
                            key={p.key}
                            className={`finStats-period-btn ${period === p.key ? "finStats-period-btn--active" : ""}`}
                            onClick={() => setPeriod(p.key)}
                            type="button"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rapports disponibles */}
            <div className="finStats-rapport-grid">
                {RAPPORTS.map(r => (
                    <div key={r.key} className="finStats-rapport-card">
                        <div className="finStats-rapport-card__info">
                            <p className="finStats-rapport-card__title">{r.label}</p>
                            <p className="finStats-rapport-card__desc">{r.desc}</p>
                            <p className="finStats-rapport-card__period">
                                Période: <strong>{PERIODS.find(p => p.key === period)?.label}</strong>
                            </p>
                        </div>
                        <div className="finStats-rapport-card__actions">
                            {FORMATS.map(f => {
                                const Icon = f.icon;
                                const key  = `${r.key}-${f.key}`;
                                const busy = exporting === key;
                                return (
                                    <button
                                        key={f.key}
                                        className="finStats-export-btn"
                                        style={{ color: f.color, borderColor: f.color }}
                                        onClick={() => handleExport(r.key, f.key)}
                                        disabled={busy}
                                        type="button"
                                        aria-label={`Exporter ${r.label} en ${f.label}`}
                                    >
                                        {busy
                                            ? <span className="finStats-export-btn__spinner" aria-hidden="true" />
                                            : <Icon size={14} aria-hidden="true" />
                                        }
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Export global */}
            <div className="finStats-chart-wrap" style={{ textAlign: "center" }}>
                <p className="finStats-chart-title">Export global</p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
                    Exporter tous les rapports de la période en un seul fichier
                </p>
                <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap" }}>
                    {FORMATS.map(f => {
                        const Icon = f.icon;
                        return (
                            <button
                                key={f.key}
                                className="app-button app-button--ghost"
                                onClick={() => handleExport("global", f.key)}
                                disabled={exporting === `global-${f.key}`}
                                type="button"
                            >
                                <Download size={16} aria-hidden="true" />
                                <Icon size={16} aria-hidden="true" />
                                Tout en {f.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Rapports;
