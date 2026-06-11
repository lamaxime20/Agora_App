import { useState, useEffect, useRef } from "react";
import {
    Truck, CheckCircle, XCircle, RotateCcw, TrendingUp, Users,
} from "lucide-react";
import { fetchDashboard, getStatutBadge, CACHE } from "../../../services/livraison.js";
import "../../../assets/styles/components/modules/livraison/Dashboard.css";

// ─── Compteur animé ───────────────────────────────────────────────────────────

function CountUp({ target, duration = 800 }) {
    const [val, setVal] = useState(0);
    const raf = useRef(null);
    useEffect(() => {
        const start = Date.now();
        const tick = () => {
            const p = Math.min(1, (Date.now() - start) / duration);
            setVal(Math.round(p * target));
            if (p < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration]);
    return <>{val}</>;
}

// ─── Graphique barres SVG (livraisons par jour) ───────────────────────────────

function BarChart({ data }) {
    if (!data?.length) return null;
    const maxVal = Math.max(...data.map(d => d.livrees + d.echecs + d.retours), 1);
    const W = 300, H = 120, barW = 24, gap = (W - data.length * barW) / (data.length + 1);

    return (
        <svg viewBox={`0 0 ${W} ${H + 28}`} className="livDash-chart__svg" aria-label="Livraisons par jour" role="img">
            {data.map((d, i) => {
                const x   = gap + i * (barW + gap);
                let y = H;
                return (
                    <g key={d.jour}>
                        {d.livrees > 0 && (() => { const h = Math.round((d.livrees / maxVal) * H); y -= h; return <rect x={x} y={y} width={barW} height={h} fill="#27AE60" rx="3" opacity="0.85" />; })()}
                        {d.echecs  > 0 && (() => { const h = Math.round((d.echecs  / maxVal) * H); y -= h; return <rect x={x} y={y} width={barW} height={h} fill="#E74C3C" rx="3" opacity="0.85" />; })()}
                        {d.retours > 0 && (() => { const h = Math.round((d.retours / maxVal) * H); y -= h; return <rect x={x} y={y} width={barW} height={h} fill="#F1C40F" rx="3" opacity="0.85" />; })()}
                        <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize="10" fill="#6B7280">{d.jour}</text>
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Graphique donut SVG (répartition statuts) ────────────────────────────────

function DonutChart({ data }) {
    if (!data) return null;
    const total = data.livrees + data.echecs + data.retours || 1;
    const R = 44, cx = 56, cy = 56, stroke = 16;
    const circumference = 2 * Math.PI * R;
    const slices = [
        { value: data.livrees, color: "#27AE60", label: "Livrées" },
        { value: data.echecs,  color: "#E74C3C", label: "Échecs"  },
        { value: data.retours, color: "#F1C40F", label: "Retours" },
    ];
    let offset = 0;
    return (
        <div className="livDash-donut">
            <svg viewBox="0 0 112 112" className="livDash-donut__svg" aria-label="Répartition des statuts" role="img">
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F0EAE2" strokeWidth={stroke} />
                {slices.map((s, i) => {
                    const dash = (s.value / total) * circumference;
                    const el = (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={R}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={stroke}
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset + circumference * 0.25}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dasharray 0.8s ease-out" }}
                        />
                    );
                    offset += dash;
                    return el;
                })}
                <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="700" fill="#2C3E50">
                    {Math.round((data.livrees / total) * 100)}%
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#6B7280">réussite</text>
            </svg>
            <ul className="livDash-donut__legend">
                {slices.map(s => (
                    <li key={s.label} className="livDash-donut__legend-item">
                        <span className="livDash-donut__legend-dot" style={{ background: s.color }} />
                        <span className="livDash-donut__legend-label">{s.label}</span>
                        <span className="livDash-donut__legend-val">{s.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
    return (
        <div className="livDash-root">
            <div className="livDash-kpi-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="livDash-kpi-card livDash-kpi-card--skeleton">
                        <div className="liv-skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                        <div className="liv-skeleton" style={{ width: "60%", height: 28, marginTop: 8 }} />
                        <div className="liv-skeleton" style={{ width: "80%", height: 14, marginTop: 6 }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────────────────────────

const KPIS = [
    { key: "enCours",        label: "En cours",          Icon: Truck,        color: "#3498DB" },
    { key: "livrees",        label: "Livrées",           Icon: CheckCircle,  color: "#27AE60" },
    { key: "echecs",         label: "Échecs",            Icon: XCircle,      color: "#E74C3C" },
    { key: "retours",        label: "Retours",           Icon: RotateCcw,    color: "#F1C40F" },
    { key: "tauxReussite",   label: "Taux de réussite",  Icon: TrendingUp,   color: "#F39C12", unit: "%" },
    { key: "livreursActifs", label: "Livreurs actifs",   Icon: Users,        color: "#2C3E50" },
];

const FILTER_OPTIONS = [
    { label: "Aujourd'hui",   params: { periode: "aujourd_hui"  } },
    { label: "Cette semaine", params: { periode: "cette_semaine" } },
    { label: "Ce mois",       params: { periode: "ce_mois"      } },
    { label: "Personnalisé",  params: null },
];

const INITIAL_PARAMS = { periode: "aujourd_hui" };

function Dashboard() {
    const [filter,    setFilter]    = useState(FILTER_OPTIONS[0].label);
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin,   setDateFin]   = useState("");
    const [data,      setData]      = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState("");

    useEffect(() => {
        const opt    = FILTER_OPTIONS.find(f => f.label === filter);
        const custom = filter === "Personnalisé";

        if (custom && (!dateDebut || !dateFin)) return;

        const params = custom
            ? { date_debut: dateDebut, date_fin: dateFin }
            : (opt?.params ?? INITIAL_PARAMS);

        (async () => {
            setLoading(true);
            setError("");

            const stale = CACHE.readDashboard(params);
            if (stale) {
                setData(stale);
                setLoading(false);
            }

            try {
                const fresh = await fetchDashboard(params);
                setData(fresh);
            } catch (err) {
                if (!stale) setError(err?.message ?? "Impossible de charger le tableau de bord.");
            } finally {
                if (!stale) setLoading(false);
            }
        })();
    }, [filter, dateDebut, dateFin]);

    if (loading && !data) return <DashboardSkeleton />;
    if (!data && error)   return <p className="livDash-error">{error}</p>;
    if (!data)            return <DashboardSkeleton />;

    return (
        <div className="livDash-root">
            {/* ── Filtres temporels ── */}
            <div className="livDash-filters" role="group" aria-label="Filtres temporels">
                {FILTER_OPTIONS.map(({ label }) => (
                    <button
                        key={label}
                        type="button"
                        className={`livDash-filter-pill${filter === label ? " livDash-filter-pill--active" : ""}`}
                        onClick={() => setFilter(label)}
                        aria-pressed={filter === label}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Dates personnalisées ── */}
            {filter === "Personnalisé" && (
                <div className="livDash-custom-dates">
                    <label className="livDash-custom-date">
                        <span>Du</span>
                        <input
                            type="date"
                            value={dateDebut}
                            onChange={e => setDateDebut(e.target.value)}
                            max={dateFin || undefined}
                        />
                    </label>
                    <label className="livDash-custom-date">
                        <span>Au</span>
                        <input
                            type="date"
                            value={dateFin}
                            onChange={e => setDateFin(e.target.value)}
                            min={dateDebut || undefined}
                        />
                    </label>
                </div>
            )}

            {error && <p className="livDash-error">{error}</p>}

            {/* ── KPIs ── */}
            <div className="livDash-kpi-grid">
                {KPIS.map(({ key, label, Icon, color, unit }) => (
                    <div key={key} className="livDash-kpi-card">
                        <div className="livDash-kpi-card__icon" style={{ background: `${color}18`, color }}>
                            <Icon size={20} aria-hidden="true" />
                        </div>
                        <p className="livDash-kpi-card__value">
                            <CountUp target={data.kpis[key] ?? 0} />
                            {unit && <span className="livDash-kpi-card__unit">{unit}</span>}
                        </p>
                        <p className="livDash-kpi-card__label">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Activité récente + graphique statuts ── */}
            <div className="livDash-row">
                <div className="livDash-activite">
                    <h2 className="livDash-section-title">Activité récente</h2>
                    <ul className="livDash-activity-list">
                        {data.activiteRecente.map(item => {
                            const badge = getStatutBadge(item.statut);
                            return (
                                <li key={item.id} className="livDash-activity-item">
                                    <div className="livDash-activity-item__left">
                                        <span className="livDash-activity-item__cmd">{item.commande}</span>
                                        <span className="livDash-activity-item__livreur">{item.livreur}</span>
                                    </div>
                                    <div className="livDash-activity-item__right">
                                        <span className={`liv-badge liv-badge--${badge.variant}`}>{badge.label}</span>
                                        <span className="livDash-activity-item__heure">{item.heure}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="livDash-statuts">
                    <h2 className="livDash-section-title">Répartition des statuts</h2>
                    <DonutChart data={data.repartitionStatuts} />
                </div>
            </div>

            {/* ── Graphique barres ── */}
            <div className="livDash-chart-card">
                <h2 className="livDash-section-title">Livraisons par jour</h2>
                <div className="livDash-chart-legend">
                    <span className="livDash-chart-legend__dot" style={{ background: "#27AE60" }} />
                    <span>Livrées</span>
                    <span className="livDash-chart-legend__dot" style={{ background: "#E74C3C" }} />
                    <span>Échecs</span>
                    <span className="livDash-chart-legend__dot" style={{ background: "#F1C40F" }} />
                    <span>Retours</span>
                </div>
                <BarChart data={data.graphiqueJours} />
            </div>
        </div>
    );
}

export default Dashboard;
