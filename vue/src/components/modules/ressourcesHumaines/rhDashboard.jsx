import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Users, DollarSign, Briefcase, AlertCircle, RefreshCw, Plus, ArrowRight, Download } from "lucide-react";
import { fetchRhDashboard } from "../../../services/rhService.js";
import { readCache } from "../../../services/rhCache.js";
import "../../../assets/styles/components/modules/ressourcesHumaines/rhDashboard.css";

// ─── Utilitaires ────────────────────────────────────────────────────────────────

const ROLE_LABELS = {
    manager_rh:            "Manager RH",
    employe_rh:            "Employé RH",
    manager_finances:      "Manager Finances",
    employe_finances:      "Employé Finances",
    manager_vente:         "Manager Vente",
    employe_vente:         "Employé Vente",
    manager_gestion_stock: "Manager Stock",
    employe_gestion_stock: "Employé Stock",
};

const fmtSalaire = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

// ─── Donut Chart SVG ─────────────────────────────────────────────────────────────

function DonutChart({ data, size = 180 }) {
    if (!data || data.length === 0) return null;
    const total = data.reduce((s, d) => s + d.count, 0);
    const cx = size / 2, cy = size / 2;
    const r = size * 0.34;
    const strokeWidth = size * 0.18;
    let cumul = 0;

    const segments = data.map((d) => {
        const pct = d.count / total;
        const startAngle = cumul * 2 * Math.PI - Math.PI / 2;
        cumul += pct;
        const endAngle = cumul * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = pct > 0.5 ? 1 : 0;
        return {
            ...d,
            path: pct >= 0.9999
                ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
                : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        };
    });

    return (
        <svg
            className="rhDash-donut-svg"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            aria-label="Répartition des rôles"
            role="img"
        >
            {segments.map((s, i) => (
                <path
                    key={i}
                    d={s.path}
                    fill="none"
                    stroke={s.couleur}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                >
                    <title>{s.label} : {s.count}</title>
                </path>
            ))}
            <text
                x={cx}
                y={cy - 8}
                textAnchor="middle"
                className="rhDash-donut__total-value"
            >
                {total}
            </text>
            <text
                x={cx}
                y={cy + 12}
                textAnchor="middle"
                className="rhDash-donut__total-label"
            >
                employés
            </text>
        </svg>
    );
}

// ─── Line Chart SVG ──────────────────────────────────────────────────────────────

function LineChart({ data }) {
    if (!data || data.length < 2) return null;
    const W = 400, H = 160;
    const pad = { top: 10, right: 12, bottom: 28, left: 8 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const vals = data.map(d => d.montant);
    const maxY = Math.max(...vals);
    const minY = Math.min(...vals) * 0.95;
    const xS = (i) => (i / (data.length - 1)) * cW;
    const yS = (v) => cH - ((v - minY) / (maxY - minY || 1)) * cH;
    const pts = data.map((d, i) => `${xS(i)},${yS(d.montant)}`).join(" ");
    const area = [`0,${cH}`, ...data.map((d, i) => `${xS(i)},${yS(d.montant)}`), `${cW},${cH}`].join(" ");
    const step = Math.ceil(data.length / 6);

    return (
        <div className="rhDash-linechart">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-label="Évolution masse salariale" role="img">
                <g transform={`translate(${pad.left},${pad.top})`}>
                    <polygon points={area} fill="rgba(243,156,18,0.10)" />
                    <polyline
                        points={pts}
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                    {data.map((d, i) => (
                        i % step === 0 && (
                            <text key={i} x={xS(i)} y={cH + 18} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
                                {d.mois}
                            </text>
                        )
                    ))}
                    {data.map((d, i) => (
                        <circle key={i} cx={xS(i)} cy={yS(d.montant)} r="3" fill="var(--color-primary)" opacity={i === data.length - 1 ? 1 : 0} />
                    ))}
                </g>
            </svg>
        </div>
    );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────────

function KpiSkeleton() {
    return (
        <div className="rhDash-kpis">
            {[0,1,2,3].map(i => (
                <div key={i} className="rhDash-kpi" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="rh-skeleton" style={{ width: 40, height: 40, borderRadius: "var(--radius-lg)" }} />
                    <div className="rh-skeleton" style={{ width: "60%", height: 12 }} />
                    <div className="rh-skeleton" style={{ width: "80%", height: 28 }} />
                </div>
            ))}
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="rhDash-charts">
            {[0,1].map(i => (
                <div key={i} className="rhDash-chart" style={{ minHeight: 300 }}>
                    <div className="rh-skeleton" style={{ width: 180, height: 20, marginBottom: "var(--space-4)" }} />
                    <div className="rh-skeleton" style={{ flex: 1, height: 220, borderRadius: "var(--radius-lg)" }} />
                </div>
            ))}
        </div>
    );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────────

function RhDashboard({ onExport }) {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur]   = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setErreur("");

        const stale = readCache("rh_dashboard");
        if (stale) {
            setData(stale);
            setLoading(false);
        }

        try {
            const res = await fetchRhDashboard();
            setData(res);
        } catch (err) {
            if (!stale) setErreur(err.message ?? "Erreur de chargement.");
        } finally {
            if (!stale) setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const KPI_CONFIG = [
        { key: "totalEmployees",       label: "Employés",        icon: Users,        iconCls: "primary",  fmt: v => v },
        { key: "salaryMass",           label: "Masse salariale", icon: DollarSign,   iconCls: "success",  fmt: fmtSalaire },
        { key: "activeRoles",          label: "Rôles actifs",    icon: Briefcase,    iconCls: "info",     fmt: v => v },
        { key: "employeesWithoutSalary", label: "Sans salaire",  icon: AlertCircle,  iconCls: "warning",  fmt: v => v },
    ];

    if (erreur && !data) {
        return (
            <div className="rhDash-error">
                <p className="rhDash-error__msg">{erreur}</p>
                <button className="rhDash-error__btn" onClick={load} type="button">
                    <RefreshCw size={14} aria-hidden="true" /> Réessayer
                </button>
            </div>
        );
    }

    return (
        <section className="rhDash-root" aria-label="Tableau de bord RH">

            {/* Actions rapides */}
            <div className="rhDash-actions" role="toolbar" aria-label="Actions rapides">
                <Link
                    to="/application/ressources-humaines/employees/add"
                    className="rhDash-action-btn rhDash-action-btn--primary"
                    aria-label="Ajouter un employé"
                >
                    <Plus size={16} aria-hidden="true" />
                    Ajouter employé
                </Link>
                <Link
                    to="/application/ressources-humaines/employees"
                    className="rhDash-action-btn rhDash-action-btn--dark"
                    aria-label="Voir tous les employés"
                >
                    <ArrowRight size={16} aria-hidden="true" />
                    Voir employés
                </Link>
                <button
                    className="rhDash-action-btn rhDash-action-btn--success"
                    onClick={onExport}
                    type="button"
                    aria-label="Exporter les données RH"
                >
                    <Download size={16} aria-hidden="true" />
                    Exporter
                </button>
            </div>

            {/* KPIs */}
            {loading && !data ? (
                <KpiSkeleton />
            ) : (
                <div className="rhDash-kpis" aria-label="Indicateurs clés">
                    {KPI_CONFIG.map(({ key, label, icon: Icon, iconCls, fmt }, i) => (
                        <article
                            key={key}
                            className="rhDash-kpi"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <div className={`rhDash-kpi__icon-wrap rhDash-kpi__icon-wrap--${iconCls}`}>
                                <Icon size={20} aria-hidden="true" />
                            </div>
                            <p className="rhDash-kpi__label">{label}</p>
                            <p className="rhDash-kpi__value">
                                {data ? fmt(data[key] ?? 0) : "—"}
                            </p>
                        </article>
                    ))}
                </div>
            )}

            {/* Graphiques */}
            {loading && !data ? (
                <ChartSkeleton />
            ) : (
                <div className="rhDash-charts">
                    {/* Donut — répartition des rôles */}
                    <div className="rhDash-chart rhDash-chart--donut">
                        <p className="rhDash-chart__title">Répartition des rôles</p>
                        {data?.rolesDistribution?.length > 0 ? (
                            <div className="rhDash-donut-wrap">
                                <DonutChart data={data.rolesDistribution} size={180} />
                                <div className="rhDash-donut-legend" aria-label="Légende">
                                    {data.rolesDistribution.map(r => (
                                        <div key={r.role} className="rhDash-donut-legend__item">
                                            <span
                                                className="rhDash-donut-legend__dot"
                                                style={{ background: r.couleur }}
                                                aria-hidden="true"
                                            />
                                            <span className="rhDash-donut-legend__label">{r.label}</span>
                                            <span className="rhDash-donut-legend__count">{r.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rhDash-empty">Aucune donnée disponible.</div>
                        )}
                    </div>

                    {/* Line — masse salariale */}
                    <div className="rhDash-chart rhDash-chart--line">
                        <p className="rhDash-chart__title">Évolution masse salariale</p>
                        {data?.salaryEvolution?.length > 0 ? (
                            <>
                                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                                    Dernier mois : <strong style={{ color: "var(--color-primary)" }}>
                                        {fmtSalaire(data.salaryEvolution[data.salaryEvolution.length - 1]?.montant ?? 0)}
                                    </strong>
                                </p>
                                <LineChart data={data.salaryEvolution} />
                            </>
                        ) : (
                            <div className="rhDash-empty">Aucune donnée disponible.</div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

export default RhDashboard;
