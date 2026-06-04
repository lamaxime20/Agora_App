import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import "../../../../../assets/styles/components/modules/gestionStocks/statsShared.css";

/* ─── Counter animé ───────────────────────────────────────────────────────────── */

function useCounter(target, duration = 900, enabled = true) {
    const [value, setValue] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!enabled || target == null) return;
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, duration, enabled]);

    return value;
}

/* ─── Variation badge ─────────────────────────────────────────────────────────── */

function Variation({ value }) {
    if (value == null) return null;
    const isPos   = value > 0;
    const isNeutral = value === 0;
    const Icon    = isNeutral ? Minus : isPos ? TrendingUp : TrendingDown;
    const mod     = isNeutral ? "neutral" : isPos ? "up" : "down";
    const sign    = isPos ? "+" : "";
    return (
        <span className={`statCard-variation statCard-variation--${mod}`}>
            <Icon size={11} aria-hidden="true" />
            {sign}{Math.abs(value).toFixed(1)} %
        </span>
    );
}

/* ─── StatCard ────────────────────────────────────────────────────────────────── */

function StatCard({
    icon: Icon,
    iconMod,
    label,
    value,
    rawValue,
    variation,
    description,
    delay = 0,
    format,
}) {
    const animated = useCounter(rawValue ?? 0, 900, rawValue != null);

    const displayValue = rawValue != null
        ? (format ? format(animated) : animated.toLocaleString("fr-FR"))
        : value;

    return (
        <div
            className="statCard-root"
            style={{ animationDelay: `${delay}ms` }}
        >
            {Icon && (
                <div className={`statCard-icon${iconMod ? ` statCard-icon--${iconMod}` : ""}`}>
                    <Icon size={20} aria-hidden="true" />
                </div>
            )}
            <div className="statCard-body">
                <p className="statCard-label">{label}</p>
                <p className="statCard-value">{displayValue}</p>
                {(variation != null || description) && (
                    <div className="statCard-footer">
                        {variation != null && <Variation value={variation} />}
                        {description && (
                            <span className="statCard-desc">{description}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────────── */

export function StatCardSkeleton({ count = 4 }) {
    return (
        <>
            {[...Array(count)].map((_, i) => (
                <div key={i} className="statCard-skeleton" aria-hidden="true">
                    <div className="statCard-skeleton__icon" />
                    <div className="statCard-skeleton__body">
                        <div className="statCard-skeleton__line statCard-skeleton__line--sm" />
                        <div className="statCard-skeleton__line statCard-skeleton__line--lg" />
                        <div className="statCard-skeleton__line statCard-skeleton__line--md" />
                    </div>
                </div>
            ))}
        </>
    );
}

export default StatCard;
