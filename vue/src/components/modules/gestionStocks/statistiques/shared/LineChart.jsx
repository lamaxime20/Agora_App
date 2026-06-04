import { useMemo, useId } from "react";
import "../../../../../assets/styles/components/modules/gestionStocks/statsShared.css";

/* ─── Génération du chemin SVG (courbe bézier smooth) ────────────────────────── */

function smoothLinePath(pts) {
    if (!pts.length) return "";
    return pts.map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1];
        const cx1  = prev.x + (p.x - prev.x) / 3;
        const cy1  = prev.y;
        const cx2  = prev.x + (2 * (p.x - prev.x)) / 3;
        const cy2  = p.y;
        return `C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
    }).join(" ");
}

function areaPath(pts, bottomY) {
    const line  = smoothLinePath(pts);
    const first = pts[0];
    const last  = pts[pts.length - 1];
    return `${line} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
}

/* ─── LineChart ───────────────────────────────────────────────────────────────── */

function LineChart({
    data,
    lines,
    xKey   = "mois",
    height = 180,
}) {
    const uid = useId();

    const W   = 400;
    const H   = height;
    const PAD = { top: 16, right: 16, bottom: 28, left: 52 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top  - PAD.bottom;

    const computed = useMemo(() => {
        if (!data?.length || !lines?.length) return null;

        const allVals = lines.flatMap(l => data.map(d => d[l.key])).filter(v => v != null);
        const minVal  = Math.min(...allVals) * 0.9;
        const maxVal  = Math.max(...allVals) * 1.05;
        const range   = maxVal - minVal || 1;

        const toSvgX = (i) => PAD.left + (i / (data.length - 1)) * plotW;
        const toSvgY = (v) => PAD.top + plotH - ((v - minVal) / range) * plotH;

        const gridYs = [0, 0.25, 0.5, 0.75, 1].map(t => ({
            y:     PAD.top + plotH * (1 - t),
            label: ((minVal + t * range) / 1000).toFixed(0) + "k",
        }));

        const lineData = lines.map(l => ({
            ...l,
            pts: data.map((d, i) => ({ x: toSvgX(i), y: toSvgY(d[l.key] ?? minVal) })),
        }));

        return { gridYs, lineData, xLabels: data.map(d => d[xKey]), toSvgX };
    }, [data, lines, xKey, plotW, plotH, PAD]);

    if (!computed) return null;

    const { gridYs, lineData, xLabels, toSvgX } = computed;

    return (
        <div className="lineChart-root">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                aria-label="Graphique d'évolution"
                role="img"
                className="lineChart-svg"
            >
                <defs>
                    {lineData.map(l => (
                        <linearGradient key={l.key} id={`${uid}-grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={l.color} stopOpacity="0.18" />
                            <stop offset="100%" stopColor={l.color} stopOpacity="0.01" />
                        </linearGradient>
                    ))}
                </defs>

                {/* Grille horizontale */}
                {gridYs.map((g, i) => (
                    <g key={i}>
                        <line
                            x1={PAD.left} y1={g.y}
                            x2={W - PAD.right} y2={g.y}
                            stroke="var(--color-border)"
                            strokeWidth="1"
                            strokeDasharray={i === 0 ? "none" : "4 4"}
                        />
                        <text
                            x={PAD.left - 6}
                            y={g.y + 4}
                            textAnchor="end"
                            fontSize="9"
                            fill="var(--color-text-light)"
                            fontFamily="var(--font-ui)"
                        >
                            {g.label}
                        </text>
                    </g>
                ))}

                {/* Labels axe X */}
                {xLabels.map((lbl, i) => (
                    <text
                        key={i}
                        x={toSvgX(i)}
                        y={H - 6}
                        textAnchor="middle"
                        fontSize="9"
                        fill="var(--color-text-light)"
                        fontFamily="var(--font-ui)"
                    >
                        {lbl}
                    </text>
                ))}

                {/* Aire + ligne pour chaque série */}
                {lineData.map(l => (
                    <g key={l.key}>
                        <path
                            d={areaPath(l.pts, PAD.top + plotH)}
                            fill={`url(#${uid}-grad-${l.key})`}
                            strokeWidth="0"
                        />
                        <path
                            d={smoothLinePath(l.pts)}
                            fill="none"
                            stroke={l.color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {l.pts.map((p, i) => (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r="3"
                                fill="var(--color-surface)"
                                stroke={l.color}
                                strokeWidth="2"
                            />
                        ))}
                    </g>
                ))}
            </svg>

            {/* Légende */}
            {lineData.length > 1 && (
                <div className="lineChart-legend">
                    {lineData.map(l => (
                        <span key={l.key} className="lineChart-legend__item">
                            <span className="lineChart-legend__dot" style={{ background: l.color }} />
                            {l.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LineChart;
