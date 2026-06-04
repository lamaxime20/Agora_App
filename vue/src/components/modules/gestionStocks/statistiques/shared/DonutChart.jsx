import { useMemo } from "react";
import "../../../../../assets/styles/components/modules/gestionStocks/statsShared.css";

/* ─── DonutChart ──────────────────────────────────────────────────────────────── */

const R          = 60;
const STROKE_W   = 18;
const CX         = 80;
const CY         = 80;
const CIRC       = 2 * Math.PI * R;

function DonutChart({ data, valueKey = "valeur", labelKey = "motif", colorKey = "color", centerLabel, centerValue }) {
    const segments = useMemo(() => {
        if (!data?.length) return [];
        const total = data.reduce((s, d) => s + (d[valueKey] ?? 0), 0);
        if (!total) return [];

        let offset = -CIRC * 0.25;
        return data.map(d => {
            const pct   = d[valueKey] / total;
            const dash  = pct * CIRC;
            const seg   = { ...d, dasharray: `${dash} ${CIRC - dash}`, offset, pct };
            offset += dash;
            return seg;
        });
    }, [data, valueKey]);

    if (!segments.length) return null;

    return (
        <div className="donutChart-root">
            <svg
                viewBox="0 0 160 160"
                className="donutChart-svg"
                aria-label="Graphique donut"
                role="img"
            >
                {/* Track */}
                <circle
                    cx={CX} cy={CY} r={R}
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth={STROKE_W}
                />

                {segments.map((seg, i) => (
                    <circle
                        key={i}
                        cx={CX} cy={CY} r={R}
                        fill="none"
                        stroke={seg[colorKey] ?? "var(--color-primary)"}
                        strokeWidth={STROKE_W}
                        strokeDasharray={seg.dasharray}
                        strokeDashoffset={-seg.offset}
                        strokeLinecap="round"
                        className="donutChart-segment"
                        style={{ animationDelay: `${i * 80}ms` }}
                    />
                ))}

                {/* Centre */}
                {centerValue != null && (
                    <>
                        <text
                            x={CX} y={CY - 6}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="18"
                            fontWeight="700"
                            fill="var(--color-text)"
                            fontFamily="var(--font-display)"
                        >
                            {centerValue}
                        </text>
                        {centerLabel && (
                            <text
                                x={CX} y={CY + 14}
                                textAnchor="middle"
                                fontSize="9"
                                fill="var(--color-text-muted)"
                                fontFamily="var(--font-ui)"
                            >
                                {centerLabel}
                            </text>
                        )}
                    </>
                )}
            </svg>

            {/* Légende */}
            <ul className="donutChart-legend">
                {segments.map((seg, i) => (
                    <li key={i} className="donutChart-legend__item">
                        <span
                            className="donutChart-legend__dot"
                            style={{ background: seg[colorKey] ?? "var(--color-primary)" }}
                        />
                        <span className="donutChart-legend__label">{seg[labelKey]}</span>
                        <span className="donutChart-legend__pct">
                            {(seg.pct * 100).toFixed(0)} %
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default DonutChart;
