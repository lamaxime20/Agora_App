import { useState, useRef, useCallback } from "react";

function buildPaths(points, W, H, pad) {
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;
    const values = points.map(p => p.solde);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;

    const xs = points.map((_, i) => pad.l + (i / (points.length - 1)) * iW);
    const ys = points.map(p => pad.t + iH - ((p.solde - minV) / range) * iH * 0.85 - iH * 0.05);

    let line = `M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
    for (let i = 1; i < xs.length; i++) {
        const cpx = ((xs[i - 1] + xs[i]) / 2).toFixed(2);
        line += ` C ${cpx} ${ys[i - 1].toFixed(2)} ${cpx} ${ys[i].toFixed(2)} ${xs[i].toFixed(2)} ${ys[i].toFixed(2)}`;
    }
    const area = line
        + ` L ${xs[xs.length - 1].toFixed(2)} ${(pad.t + iH).toFixed(2)}`
        + ` L ${xs[0].toFixed(2)} ${(pad.t + iH).toFixed(2)} Z`;

    return { line, area, xs, ys, minV, maxV, iH, iW };
}

function GraphiqueTresorerie({ loading, data }) {
    const [tooltip, setTooltip] = useState(null);
    const svgRef = useRef(null);

    const fmt = (n) =>
        new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

    const formatDate = useCallback((d) => {
        return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(d));
    }, []);

    if (loading) {
        return (
            <div className="finDash-chart">
                <div className="finDash-chart__header">
                    <div className="finDash-skeleton finDash-skeleton--title" />
                    <div className="finDash-skeleton finDash-skeleton--badge" />
                </div>
                <div className="finDash-chart__skeleton-graph finDash-skeleton" />
            </div>
        );
    }

    if (!data?.points?.length) {
        return (
            <div className="finDash-chart">
                <p className="finDash-chart__empty">Aucune donnée de trésorerie disponible.</p>
            </div>
        );
    }

    const points = data.points;
    const W = 560;
    const H = 180;
    const pad = { t: 16, b: 36, l: 8, r: 8 };
    const { line, area, xs, ys } = buildPaths(points, W, H, pad);

    const LABEL_STEP = Math.ceil(points.length / 5);

    return (
        <div className="finDash-chart">
            <div className="finDash-chart__header">
                <p className="finDash-chart__title">Trésorerie — 30 derniers jours</p>
                <span className="finDash-chart__period">{data.periode}</span>
            </div>

            <div className="finDash-chart__wrap">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="none"
                    className="finDash-chart__svg"
                    aria-label="Courbe de trésorerie sur 30 jours"
                    role="img"
                    onMouseLeave={() => setTooltip(null)}
                >
                    <defs>
                        <linearGradient id="chartGradFin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#F39C12" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#F39C12" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* Aire remplie */}
                    <path d={area} fill="url(#chartGradFin)" />

                    {/* Courbe principale */}
                    <path
                        d={line}
                        fill="none"
                        stroke="#F39C12"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Point survolé */}
                    {tooltip !== null && (
                        <>
                            <line
                                x1={xs[tooltip].toFixed(2)}
                                y1={pad.t}
                                x2={xs[tooltip].toFixed(2)}
                                y2={H - pad.b}
                                stroke="#F39C12"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                                opacity="0.6"
                            />
                            <circle
                                cx={xs[tooltip].toFixed(2)}
                                cy={ys[tooltip].toFixed(2)}
                                r="5"
                                fill="#F39C12"
                                stroke="#fff"
                                strokeWidth="2"
                            />
                        </>
                    )}

                    {/* Zones de survol invisibles */}
                    {points.map((p, i) => {
                        const zoneW = W / points.length;
                        return (
                            <rect
                                key={i}
                                x={Math.max(0, xs[i] - zoneW / 2)}
                                y={0}
                                width={zoneW}
                                height={H}
                                fill="transparent"
                                style={{ cursor: "crosshair" }}
                                onMouseEnter={() => setTooltip(i)}
                            />
                        );
                    })}

                    {/* Labels axe X */}
                    {points.map((p, i) => {
                        if (i % LABEL_STEP !== 0 && i !== points.length - 1) return null;
                        return (
                            <text
                                key={i}
                                x={xs[i].toFixed(2)}
                                y={H - 6}
                                textAnchor="middle"
                                fontSize="9"
                                fill="#9CA3AF"
                                fontFamily="Inter, sans-serif"
                            >
                                {p.label}
                            </text>
                        );
                    })}
                </svg>

                {/* Tooltip flottant */}
                {tooltip !== null && (
                    <div
                        className="finDash-chart__tooltip"
                        style={{
                            left: `${(xs[tooltip] / W) * 100}%`,
                            top: `${(ys[tooltip] / H) * 100}%`,
                        }}
                    >
                        <span className="finDash-chart__tooltip-date">{formatDate(points[tooltip].date)}</span>
                        <span className="finDash-chart__tooltip-val">{fmt(points[tooltip].solde)} FCFA</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GraphiqueTresorerie;
