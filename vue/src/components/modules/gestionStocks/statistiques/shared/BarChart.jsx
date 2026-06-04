import { useEffect, useState } from "react";
import "../../../../../assets/styles/components/modules/gestionStocks/statsShared.css";

/* ─── BarChart — barres horizontales CSS ──────────────────────────────────────── */

function BarChart({
    data,
    valueKey  = "value",
    labelKey  = "label",
    color     = "var(--color-primary)",
    unit      = "",
    maxItems  = 8,
    formatVal,
}) {
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setAnimated(true), 80);
        return () => clearTimeout(t);
    }, []);

    if (!data?.length) return null;

    const slice = data.slice(0, maxItems);
    const max   = Math.max(...slice.map(d => d[valueKey]));

    return (
        <ul className="barChart-root" aria-label="Graphique en barres">
            {slice.map((item, i) => {
                const pct  = max > 0 ? (item[valueKey] / max) * 100 : 0;
                const val  = formatVal ? formatVal(item[valueKey]) : (item[valueKey].toLocaleString("fr-FR") + (unit ? ` ${unit}` : ""));
                return (
                    <li key={i} className="barChart-item">
                        <span className="barChart-label" title={item[labelKey]}>
                            {item[labelKey]}
                        </span>
                        <div className="barChart-track">
                            <div
                                className="barChart-bar"
                                style={{
                                    width:  animated ? `${pct}%` : "0%",
                                    background: color,
                                    transitionDelay: `${i * 60}ms`,
                                }}
                                role="meter"
                                aria-valuenow={item[valueKey]}
                                aria-valuemin={0}
                                aria-valuemax={max}
                                aria-label={`${item[labelKey]} : ${val}`}
                            />
                        </div>
                        <span className="barChart-value">{val}</span>
                    </li>
                );
            })}
        </ul>
    );
}

export default BarChart;
