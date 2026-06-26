import { useState, useEffect, useCallback } from "react";
import { X, Download, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchSalairePaiements } from "../../../../services/financesP5.js";
import { readCache } from "../../../../services/financesCache.js";
import { exportSalaires } from "../../../../services/exportService.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
    d ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d)) : "—";

function getInitiales(prenom, nom) {
    return [(prenom?.[0] ?? ""), (nom?.[0] ?? "")].join("").toUpperCase();
}

function RowSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="finSal-detail__row">
                    <div className="finSal-skeleton finSal-skeleton--md" />
                    <div className="finSal-skeleton finSal-skeleton--sm" />
                </div>
            ))}
        </div>
    );
}

function PaiementDetailPane({ paiement, salarie, onClose }) {
    return (
        <>
            <div
                className="finSal-drawer__overlay finSal-drawer__overlay--tertiary"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finSal-drawer finSal-drawer--tertiary"
                role="complementary"
                aria-label={`Détail paiement ${paiement.id}`}
            >
                <div className="finSal-drawer__handle">
                    <div className="finSal-drawer__handle-bar" />
                </div>
                <div className="finSal-drawer__header">
                    <h2 className="finSal-drawer__title" style={{ fontSize: "var(--text-base)" }}>
                        Paiement {paiement.id}
                    </h2>
                    <button className="finSal-drawer__close" onClick={onClose} aria-label="Fermer" type="button">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <div className="finSal-drawer__body">
                    <section>
                        <p className="finSal-detail__section-label">Versement</p>
                        <div className="finSal-detail__row">
                            <span className="finSal-detail__key">Période</span>
                            <span className="finSal-detail__val">{paiement.periode}</span>
                        </div>
                        <div className="finSal-detail__row">
                            <span className="finSal-detail__key">Date de versement</span>
                            <span className="finSal-detail__val">{fmtDate(paiement.date)}</span>
                        </div>
                        <div className="finSal-detail__row">
                            <span className="finSal-detail__key">Montant net versé</span>
                            <span className="finSal-detail__val finSal-detail__val--amount" style={{ color: "var(--color-error)" }}>
                                {fmt(paiement.montant)}
                            </span>
                        </div>
                        <div className="finSal-detail__row">
                            <span className="finSal-detail__key">Mode de paiement</span>
                            <span className="finSal-detail__val">{paiement.mode}</span>
                        </div>
                        <div className="finSal-detail__row">
                            <span className="finSal-detail__key">Référence transaction</span>
                            <span className="finSal-detail__val" style={{ fontFamily: "var(--font-mono)" }}>
                                {paiement.reference}
                            </span>
                        </div>
                        <div className="finSal-detail__row">
                            <span className="finSal-detail__key">Effectué par</span>
                            <span className="finSal-detail__val">{paiement.utilisateur}</span>
                        </div>
                    </section>
                    <section>
                        <p className="finSal-detail__section-label">Salarié</p>
                        <div className="finSal-detail__row">
                            <span className="finSal-detail__key">Nom</span>
                            <span className="finSal-detail__val">{salarie.prenom} {salarie.nom}</span>
                        </div>
                        <div className="finSal-detail__row">
                            <span className="finSal-detail__key">Poste</span>
                            <span className="finSal-detail__val">{salarie.poste}</span>
                        </div>
                        <div className="finSal-detail__row">
                            <span className="finSal-detail__key">Identifiant</span>
                            <span className="finSal-detail__val" style={{ fontFamily: "var(--font-mono)" }}>
                                {salarie.id}
                            </span>
                        </div>
                    </section>
                </div>
                <div className="finSal-drawer__footer">
                    <button
                        className="app-button app-button--ghost"
                        style={{ width: "100%" }}
                        onClick={onClose}
                        type="button"
                    >
                        Fermer
                    </button>
                </div>
            </aside>
        </>
    );
}

function HistoriquePaiementsSalarie({ salarie, onClose }) {
    const [loading, setLoading]       = useState(true);
    const [paiements, setPaiements]   = useState([]);
    const [meta, setMeta]             = useState(null);
    const [page, setPage]             = useState(1);
    const [exportOpen, setExportOpen] = useState(false);
    const [exporting, setExporting]   = useState(null);
    const [selectedPay, setSelectedPay] = useState(null);

    const load = useCallback(async () => {
        setLoading(true); // Always set loading to true initially

        const cacheKey = `salaire_paiements_${salarie.id}_${page}`; // As per financesP5.js
        const staleData = readCache(cacheKey);

        if (staleData) {
            setPaiements(staleData.data ?? []);
            setMeta(staleData.meta ?? null);
            setLoading(false); // Display stale data immediately
        }

        try {
            const res = await fetchSalairePaiements(salarie.id, page);
            setPaiements(res.data ?? []);
            setMeta(res.meta ?? null);
        } catch {
            // silent — keep empty state
        }
        setLoading(false); // Ensure loading is false after fetch attempt
    }, [salarie.id, page]);

    useEffect(() => { load(); }, [load]);

    const totalPages    = meta ? Math.ceil(meta.total / (meta.per_page ?? 20)) : 1;
    const totalVerseP   = paiements.reduce((s, p) => s + p.montant, 0);

    const handleExport = async (fmtKey) => {
        if (exporting === fmtKey) return;
        setExporting(fmtKey);
        setExportOpen(false);
        try {
            await exportSalaires(fmtKey, { salarie_id: salarie.id });
        } catch { /* silencieux */ } finally {
            setExporting(null);
        }
    };

    return (
        <>
            <div
                className="finSal-drawer__overlay finSal-drawer__overlay--secondary"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finSal-drawer finSal-drawer--secondary"
                role="complementary"
                aria-label={`Historique des paiements de ${salarie.prenom} ${salarie.nom}`}
            >
                <div className="finSal-drawer__handle">
                    <div className="finSal-drawer__handle-bar" />
                </div>
                <div className="finSal-drawer__header">
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <div className="finSal-avatar finSal-avatar--sm" aria-hidden="true">
                            {getInitiales(salarie.prenom, salarie.nom)}
                        </div>
                        <div>
                            <h2 className="finSal-drawer__title" style={{ fontSize: "var(--text-base)" }}>
                                {salarie.prenom} {salarie.nom}
                            </h2>
                            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                Historique des paiements
                            </p>
                        </div>
                    </div>
                    <button className="finSal-drawer__close" onClick={onClose} aria-label="Fermer" type="button">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finSal-drawer__body">
                    {/* Mini-KPIs */}
                    <div className="finSal-kpis" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "var(--space-4)" }}>
                        <div className="finSal-kpi">
                            <p className="finSal-kpi__label">Paiements (page)</p>
                            <p className="finSal-kpi__value">{meta?.total ?? paiements.length}</p>
                        </div>
                        <div className="finSal-kpi">
                            <p className="finSal-kpi__label">Total versé</p>
                            <p className="finSal-kpi__value finSal-kpi__value--error">{fmt(totalVerseP)}</p>
                        </div>
                    </div>

                    {/* Export */}
                    <div className="finSal-export-wrap" style={{ marginBottom: "var(--space-4)" }}>
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => setExportOpen(o => !o)}
                            type="button"
                            aria-expanded={exportOpen}
                        >
                            <Download size={16} aria-hidden="true" />
                            Exporter
                            <ChevronDown size={14} aria-hidden="true" />
                        </button>
                        {exportOpen && (
                            <div className="finSal-export-menu" role="menu">
                                {["pdf", "csv", "docx"].map(f => (
                                    <button
                                        key={f}
                                        className="finSal-export-menu__item"
                                        onClick={() => handleExport(f)}
                                        disabled={exporting === f}
                                        role="menuitem"
                                        type="button"
                                    >
                                        {f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <RowSkeleton />
                    ) : paiements.length === 0 ? (
                        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", textAlign: "center", padding: "var(--space-8) 0" }}>
                            Aucun paiement enregistré.
                        </p>
                    ) : (
                        <>
                            {paiements.map(p => (
                                <div
                                    key={p.id}
                                    className="finSal-detail__row finSal-detail__row--clickable"
                                    onClick={() => setSelectedPay(p)}
                                >
                                    <div>
                                        <p style={{ margin: 0, fontWeight: "var(--weight-medium)", fontSize: "var(--text-sm)" }}>
                                            {p.periode}
                                        </p>
                                        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                            {fmtDate(p.date)} · {p.reference}
                                        </p>
                                    </div>
                                    <span style={{ color: "var(--color-error)", fontFamily: "var(--font-display)", fontWeight: "var(--weight-bold)", fontSize: "var(--text-sm)" }}>
                                        {fmt(p.montant)}
                                    </span>
                                </div>
                            ))}

                            {totalPages > 1 && (
                                <div className="finSal-pagination" style={{ marginTop: "var(--space-4)" }}>
                                    <button
                                        className="finSal-pagination__btn"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        type="button"
                                        aria-label="Page précédente"
                                    >
                                        <ChevronLeft size={16} aria-hidden="true" />
                                    </button>
                                    <span className="finSal-pagination__info">Page {page} / {totalPages}</span>
                                    <button
                                        className="finSal-pagination__btn"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        type="button"
                                        aria-label="Page suivante"
                                    >
                                        <ChevronRight size={16} aria-hidden="true" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="finSal-drawer__footer">
                    <button
                        className="app-button app-button--ghost"
                        style={{ width: "100%" }}
                        onClick={onClose}
                        type="button"
                    >
                        Fermer
                    </button>
                </div>
            </aside>

            {selectedPay && (
                <PaiementDetailPane
                    paiement={selectedPay}
                    salarie={salarie}
                    onClose={() => setSelectedPay(null)}
                />
            )}
        </>
    );
}

export default HistoriquePaiementsSalarie;
