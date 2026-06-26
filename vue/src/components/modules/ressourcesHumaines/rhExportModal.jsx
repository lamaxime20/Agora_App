import { useState } from "react";
import { X, Download, Loader2, Check } from "lucide-react";
import { exportRh } from "../../../services/rhService.js";

const FORMATS = [
    { key: "csv",  name: "CSV",  icon: "CSV",  desc: "Données tabulaires, compatible Excel" },
    { key: "pdf",  name: "PDF",  icon: "PDF",  desc: "Rapport formaté prêt à imprimer" },
    { key: "docx", name: "DOCX", icon: "DOC",  desc: "Document Word éditable" },
];

function RhExportModal({ onClose, context = "dashboard" }) {
    const [format, setFormat]   = useState("pdf");
    const [loading, setLoading] = useState(false);
    const [done, setDone]       = useState(false);
    const [error, setError]     = useState("");

    const handleExport = async () => {
        setLoading(true);
        setError("");
        try {
            await exportRh(format, context);
            setDone(true);
            setTimeout(onClose, 1500);
        } catch {
            setError("Impossible de générer l'export. Réessayez.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="rhExport-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rhExport-title"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div className="rhExport-panel">
                <div className="rhExport-header">
                    <h2 className="rhExport-title" id="rhExport-title">Exporter les données</h2>
                    <button className="rhExport-close" onClick={onClose} aria-label="Fermer" type="button">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="rhExport-options" role="radiogroup" aria-label="Format d'export">
                    {FORMATS.map(f => (
                        <button
                            key={f.key}
                            className={`rhExport-option${format === f.key ? " rhExport-option--selected" : ""}`}
                            onClick={() => setFormat(f.key)}
                            type="button"
                            role="radio"
                            aria-checked={format === f.key}
                        >
                            <div className="rhExport-option__icon">{f.icon}</div>
                            <div>
                                <p className="rhExport-option__name">{f.name}</p>
                                <p className="rhExport-option__desc">{f.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {error && (
                    <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: 0, textAlign: "center" }}>
                        {error}
                    </p>
                )}

                <button
                    className="rhExport-submit"
                    onClick={handleExport}
                    disabled={loading || done}
                    aria-busy={loading}
                    type="button"
                >
                    {done
                        ? <><Check size={16} aria-hidden="true" /> Exporté !</>
                        : loading
                            ? <><Loader2 size={16} className="rh-spin" aria-hidden="true" /> Génération…</>
                            : <><Download size={16} aria-hidden="true" /> Exporter en {format.toUpperCase()}</>
                    }
                </button>
            </div>
        </div>
    );
}

export default RhExportModal;
