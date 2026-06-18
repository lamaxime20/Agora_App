import { useState, useEffect, useCallback } from "react";
import { RefreshCw, DollarSign, Users, Briefcase, TrendingUp, Download, BarChart2 } from "lucide-react";
import { fetchRhStatistics } from "../../../services/rhService.js";
import { readCache } from "../../../services/rhCache.js";
import "../../../assets/styles/components/modules/ressourcesHumaines/rhStats.css";

// ─── Utilitaires ──────────────────────────────────────────────────────────────────

const ROLE_LABELS = {
    manager_rh: "Manager RH", employe_rh: "Employé RH",
    manager_finances: "Manager Finances", employe_finances: "Employé Finances",
    manager_vente: "Manager Vente", employe_vente: "Employé Vente",
    manager_gestion_stock: "Manager Stock", employe_gestion_stock: "Employé Stock",
};

const fmtSalaire = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const FILTERS = [
    { key: "7j",   label: "7 jours" },
    { key: "30j",  label: "30 jours" },
    { key: "12m",  label: "12 mois" },
    { key: "perso",label: "Personnalisé" },
];

// ─── Bar Chart ────────────────────────────────────────────────────────────────────

function BarChart({ data }) {
    if (!data || data.length === 0) return <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Aucune donnée.</p>;
    const max = Math.max(...data.map(d => d.total));
    return (
        <div className="rhStats-barchart" aria-label="Masse salariale par rôle">
            {data.map(d => (
                <div key={d.role} className="rhStats-bar-row">
                    <span className="rhStats-bar-label" title={d.label}>{d.label}</span>
                    <div className="rhStats-bar-track" role="progressbar" aria-valuenow={Math.round((d.total / max) * 100)} aria-valuemin={0} aria-valuemax={100}>
                        <div
                            className="rhStats-bar-fill"
                            style={{ width: `${Math.round((d.total / max) * 100)}%`, background: d.couleur }}
                        />
                    </div>
                    <span className="rhStats-bar-amount">{fmtSalaire(d.total)}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────────

function LineChart({ data }) {
    if (!data || data.length < 2) return null;
    const W = 400, H = 140;
    const pad = { top: 10, right: 12, bottom: 28, left: 8 };
    const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
    const vals = data.map(d => d.count);
    const maxY = Math.max(...vals), minY = Math.max(0, Math.min(...vals) - 2);
    const xS = (i) => (i / (data.length - 1)) * cW;
    const yS = (v) => cH - ((v - minY) / (maxY - minY || 1)) * cH;
    const pts = data.map((d, i) => `${xS(i)},${yS(d.count)}`).join(" ");
    const area = [`0,${cH}`, ...data.map((d, i) => `${xS(i)},${yS(d.count)}`), `${cW},${cH}`].join(" ");
    const step = Math.ceil(data.length / 6);

    return (
        <div className="rhStats-linechart">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-label="Évolution des effectifs" role="img">
                <g transform={`translate(${pad.left},${pad.top})`}>
                    <polygon points={area} fill="rgba(44,62,80,0.08)" />
                    <polyline points={pts} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    {data.map((d, i) => (
                        i % step === 0 && (
                            <text key={i} x={xS(i)} y={cH + 18} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">{d.mois}</text>
                        )
                    ))}
                    <circle cx={xS(data.length - 1)} cy={yS(data[data.length - 1].count)} r="4" fill="var(--color-accent)" />
                </g>
            </svg>
        </div>
    );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────────

function DonutChart({ data, size = 160 }) {
    if (!data || data.length === 0) return null;
    const total = data.reduce((s, d) => s + d.count, 0);
    const cx = size / 2, cy = size / 2, r = size * 0.34, sw = size * 0.18;
    let cumul = 0;

    const segs = data.map(d => {
        const pct = d.count / total;
        const start = cumul * 2 * Math.PI - Math.PI / 2;
        cumul += pct;
        const end = cumul * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
        const la = pct > 0.5 ? 1 : 0;
        return {
            ...d,
            path: pct >= 0.9999
                ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
                : `M ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2}`,
        };
    });

    return (
        <div className="rhStats-donut-wrap" aria-label="Répartition des employés">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ flexShrink: 0 }}>
                {segs.map((s, i) => (
                    <path key={i} d={s.path} fill="none" stroke={s.couleur} strokeWidth={sw} strokeLinecap="round">
                        <title>{s.label} : {s.count} ({s.pourcentage?.toFixed(1)}%)</title>
                    </path>
                ))}
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--color-accent)">{total}</text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">employés</text>
            </svg>
            <div className="rhStats-donut-legend">
                {data.map(d => (
                    <div key={d.role} className="rhStats-donut-legend__item">
                        <span className="rhStats-donut-legend__dot" style={{ background: d.couleur }} aria-hidden="true" />
                        <span className="rhStats-donut-legend__label">{d.label}</span>
                        <span className="rhStats-donut-legend__pct">{d.pourcentage?.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────────

function StatsSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <div className="rhStats-kpis">
                {[0,1,2,3].map(i => (
                    <div key={i} className="rhStats-kpi">
                        <div className="rh-skeleton rhStats-skeleton--sm" />
                        <div className="rh-skeleton rhStats-skeleton--md" style={{ marginTop: 4 }} />
                    </div>
                ))}
            </div>
            {[0,1,2].map(i => (
                <div key={i} className="rhStats-chart">
                    <div className="rh-skeleton rhStats-skeleton--sm" />
                    <div className="rh-skeleton" style={{ height: 180, borderRadius: "var(--radius-lg)" }} />
                </div>
            ))}
        </div>
    );
}

// ─── Statistiques ─────────────────────────────────────────────────────────────────

function RhStatistics({ onExport }) {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur]   = useState("");
    const [periode, setPeriode] = useState("12m");

    const load = useCallback(async () => {
        setLoading(true);
        setErreur("");

        const cacheKey = `rh_statistics_${periode}`;
        const stale = readCache(cacheKey);
        if (stale) { setData(stale); setLoading(false); }

        try {
            const res = await fetchRhStatistics(periode);
            setData(res);
        } catch (err) {
            if (!stale) setErreur(err.message ?? "Erreur de chargement.");
        } finally {
            if (!stale) setLoading(false);
        }
    }, [periode]);

    useEffect(() => { load(); }, [load]);

    if (erreur && !data) {
        return (
            <section className="rhStats-root">
                <div className="rhDash-error">
                    <p className="rhDash-error__msg">{erreur}</p>
                    <button className="rhDash-error__btn" onClick={load} type="button">
                        <RefreshCw size={14} aria-hidden="true" /> Réessayer
                    </button>
                </div>
            </section>
        );
    }

    const KPI_CONFIG = [
        { label: "Coût humain",    value: data ? fmtSalaire(data.totalCost ?? 0) : "—",  icon: DollarSign,  style: {} },
        { label: "Salaire moyen",  value: data ? fmtSalaire(data.averageSalary ?? 0) : "—", icon: TrendingUp, style: {} },
        { label: "Rôle dominant",  value: data ? (ROLE_LABELS[data.mostRepresentedRole] ?? data.mostRepresentedRole ?? "—") : "—", icon: Briefcase, style: { fontSize: "var(--text-sm)" } },
        { label: "Nb. employés",   value: data ? (data.employeesDistribution?.reduce((s, d) => s + d.count, 0) ?? "—") : "—", icon: Users, style: {} },
    ];

    return (
        <section className="rhStats-root" aria-label="Statistiques RH">

            {/* Header */}
            <div className="rhStats-header">
                <h1 className="rhStats-header__title">Statistiques RH</h1>
                {onExport && (
                    <button
                        className="rhDash-action-btn rhDash-action-btn--success"
                        onClick={onExport}
                        type="button"
                        style={{ height: 40 }}
                        aria-label="Exporter les statistiques"
                    >
                        <Download size={16} aria-hidden="true" />
                        Exporter
                    </button>
                )}
            </div>

            {/* Filtres période */}
            <div className="rhStats-filters" role="group" aria-label="Filtres période">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        className={`rhStats-filter-btn${periode === f.key ? " rhStats-filter-btn--active" : ""}`}
                        onClick={() => setPeriode(f.key)}
                        type="button"
                        aria-pressed={periode === f.key}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading && !data ? <StatsSkeleton /> : (
                <>
                    {/* KPIs */}
                    <div className="rhStats-kpis" aria-label="Indicateurs">
                        {KPI_CONFIG.map(({ label, value, icon: Icon }, i) => (
                            <article key={label} className="rhStats-kpi" style={{ animationDelay: `${i * 50}ms` }}>
                                <p className="rhStats-kpi__label">{label}</p>
                                <p className="rhStats-kpi__value" style={KPI_CONFIG[i].style}>{value}</p>
                            </article>
                        ))}
                    </div>

                    {/* Masse salariale par rôle */}
                    <div className="rhStats-chart">
                        <p className="rhStats-chart__title">Masse salariale par rôle</p>
                        {data?.salaryByRole ? <BarChart data={data.salaryByRole} /> : null}
                    </div>

                    {/* Évolution effectifs */}
                    <div className="rhStats-chart">
                        <p className="rhStats-chart__title">Évolution des effectifs</p>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                            Dernier mois : <strong style={{ color: "var(--color-accent)" }}>
                                {data?.employeesEvolution?.[data.employeesEvolution.length - 1]?.count ?? 0} employés
                            </strong>
                        </p>
                        {data?.employeesEvolution ? <LineChart data={data.employeesEvolution} /> : null}
                    </div>

                    {/* Répartition employés */}
                    <div className="rhStats-chart">
                        <p className="rhStats-chart__title">Répartition des employés</p>
                        {data?.employeesDistribution ? <DonutChart data={data.employeesDistribution} size={160} /> : null}
                    </div>
                </>
            )}
        </section>
    );
}

export default RhStatistics;
