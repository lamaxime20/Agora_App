import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { fetchStatsTresorerie } from "../../../../services/financesP5.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

function SvgLineChart({ points }) {
    if (!points || points.length < 2) return null;

    const W = 600;
    const H = 200;
    const PAD = { top: 16, right: 16, bottom: 32, left: 72 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const values   = points.map(p => p.valeur);
    const minVal   = Math.min(...values);
    const maxVal   = Math.max(...values);
    const range    = maxVal - minVal || 1;

    const toX = (i) => PAD.left + (i / (points.length - 1)) * innerW;
    const toY = (v) => PAD.top + innerH - ((v - minVal) / range) * innerH;

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.valeur)}`).join(" ");

    const areaD = [
        `M ${toX(0)} ${toY(points[0].valeur)}`,
        ...points.slice(1).map((p, i) => `L ${toX(i + 1)} ${toY(p.valeur)}`),
        `L ${toX(points.length - 1)} ${PAD.top + innerH}`,
        `L ${toX(0)} ${PAD.top + innerH}`,
        "Z",
    ].join(" ");

    const tickCount = 4;
    const yTicks = Array.from({ length: tickCount }, (_, i) =>
        minVal + (range / (tickCount - 1)) * i
    );

    const labelStep = Math.max(1, Math.floor(points.length / 6));
    const xLabels = points.filter((_, i) => i % labelStep === 0 || i === points.length - 1);

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="finStats-svg-chart"
            aria-label="Courbe de trésorerie"
            role="img"
        >
            <defs>
                <linearGradient id="tresAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="var(--color-primary)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.01" />
                </linearGradient>
            </defs>

            {yTicks.map((tick, i) => (
                <g key={i}>
                    <line
                        x1={PAD.left} y1={toY(tick)}
                        x2={PAD.left + innerW} y2={toY(tick)}
                        stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4,4"
                    />
                    <text
                        x={PAD.left - 8} y={toY(tick) + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="var(--color-text-muted)"
                    >
                        {tick >= 1000000 ? `${(tick / 1000000).toFixed(1)}M` : tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
                    </text>
                </g>
            ))}

            <path d={areaD} fill="url(#tresAreaGrad)" />
            <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((p, i) => (
                <circle key={i} cx={toX(i)} cy={toY(p.valeur)} r="3.5" fill="var(--color-primary)" />
            ))}

            {xLabels.map(p => {
                const i = points.indexOf(p);
                return (
                    <text
                        key={p.date}
                        x={toX(i)} y={H - 8}
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--color-text-muted)"
                    >
                        {p.date.length === 7 ? p.date.slice(0, 7) : p.date.slice(5)}
                    </text>
                );
            })}
        </svg>
    );
}

function Tresorerie() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats]     = useState(null);

    useEffect(() => {
        fetchStatsTresorerie()
            .then(d => { setStats(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="finStats-tab-content">
                <div className="finStats-kpis">
                    {[1, 2].map(i => (
                        <div key={i} className="finStats-kpi">
                            <div className="finStats-skeleton finStats-skeleton--sm" />
                            <div className="finStats-skeleton finStats-skeleton--md" style={{ marginTop: 6 }} />
                        </div>
                    ))}
                </div>
                <div className="finStats-chart-wrap" style={{ height: 240 }}>
                    <div className="finStats-skeleton" style={{ height: "100%", borderRadius: "var(--radius-xl)" }} />
                </div>
            </div>
        );
    }

    if (!stats) return <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Données indisponibles.</p>;

    const points      = stats.evolution ?? [];
    const soldeActuel = points.length ? (points[points.length - 1].valeur ?? 0) : 0;
    const premier     = points.length ? (points[0].valeur ?? 0) : null;
    const variation   = premier != null && premier !== 0
        ? parseFloat(((soldeActuel - premier) / Math.abs(premier) * 100).toFixed(1))
        : null;

    return (
        <div className="finStats-tab-content">
            <div className="finStats-kpis">
                <div className="finStats-kpi">
                    <div className="finStats-kpi__icon-wrap finStats-kpi__icon-wrap--balance">
                        <TrendingUp size={18} aria-hidden="true" />
                    </div>
                    <p className="finStats-kpi__label">Solde actuel</p>
                    <p className="finStats-kpi__value finStats-kpi__value--primary">{fmt(soldeActuel)}</p>
                </div>
                {variation !== null && (
                    <div className="finStats-kpi">
                        <div className={`finStats-kpi__icon-wrap ${variation >= 0 ? "finStats-kpi__icon-wrap--income" : "finStats-kpi__icon-wrap--expense"}`}>
                            {variation >= 0
                                ? <TrendingUp size={18} aria-hidden="true" />
                                : <TrendingDown size={18} aria-hidden="true" />
                            }
                        </div>
                        <p className="finStats-kpi__label">Variation (30 jours)</p>
                        <p className={`finStats-kpi__value ${variation >= 0 ? "finStats-kpi__value--success" : "finStats-kpi__value--error"}`}>
                            {variation >= 0 ? "+" : ""}{variation}%
                        </p>
                    </div>
                )}
            </div>

            <div className="finStats-chart-wrap">
                <p className="finStats-chart-title">Évolution de la trésorerie (30 jours)</p>
                <SvgLineChart points={points} />
            </div>
        </div>
    );
}

export default Tresorerie;
