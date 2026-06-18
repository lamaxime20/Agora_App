import { useEffect, useState } from "react";

function useCountUp(target, duration = 800) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (target == null || target === 0) { setValue(0); return; }
        setValue(0);
        const start = Date.now();
        const tick = () => {
            const progress = Math.min((Date.now() - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(ease * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        const id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [target, duration]);
    return value;
}

function ArgentVirtuelCard({ loading, data }) {
    const animatedValue = useCountUp(loading ? 0 : (data?.argent_virtuel ?? 0));

    const fmt = (n) =>
        new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

    if (loading) {
        return (
            <div className="finDash-argent finDash-argent--skeleton">
                <div className="finDash-skeleton finDash-skeleton--label" />
                <div className="finDash-skeleton finDash-skeleton--value" />
                <div className="finDash-skeleton finDash-skeleton--badge" />
            </div>
        );
    }

    return (
        <div className="finDash-argent">
            <p className="finDash-argent__eyebrow">Argent virtuel</p>
            <p className="finDash-argent__value" aria-live="polite">
                {fmt(animatedValue)}
                <span className="finDash-argent__currency"> FCFA</span>
            </p>
        </div>
    );
}

export default ArgentVirtuelCard;
