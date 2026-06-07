import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

function BilanCard({ loading, data }) {
    const fmt = (n) =>
        new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n ?? 0);

    if (loading) {
        return (
            <div className="finDash-bilan finDash-bilan--skeleton">
                {[1, 2, 3].map(i => (
                    <div key={i} className="finDash-bilan__row--skeleton">
                        <div className="finDash-skeleton finDash-skeleton--icon" />
                        <div className="finDash-skeleton finDash-skeleton--line" />
                    </div>
                ))}
            </div>
        );
    }

    const rows = [
        {
            key: "entrees",
            label: "Entrées du mois",
            value: data?.entrees,
            variation: data?.variations?.entrees,
            icon: ArrowUpRight,
            color: "success",
        },
        {
            key: "sorties",
            label: "Sorties du mois",
            value: data?.sorties,
            variation: data?.variations?.sorties,
            icon: ArrowDownRight,
            color: "error",
        },
        {
            key: "benefice",
            label: "Bénéfice net",
            value: data?.benefice,
            variation: data?.variations?.benefice,
            icon: Wallet,
            color: "primary",
        },
    ];

    return (
        <div className="finDash-bilan">
            <p className="finDash-bilan__title">Résumé du mois</p>
            {rows.map(({ key, label, value, variation, icon: Icon, color }) => {
                const positive = (variation ?? 0) >= 0;
                return (
                    <div key={key} className="finDash-bilan__row">
                        <div className={`finDash-bilan__icon finDash-bilan__icon--${color}`}>
                            <Icon size={16} aria-hidden="true" />
                        </div>
                        <div className="finDash-bilan__body">
                            <span className="finDash-bilan__label">{label}</span>
                            <span className="finDash-bilan__amount">{fmt(value)} FCFA</span>
                        </div>
                        {variation != null && (
                            <span className={`finDash-bilan__variation ${positive ? "finDash-bilan__variation--up" : "finDash-bilan__variation--down"}`}>
                                {positive
                                    ? <TrendingUp size={12} aria-hidden="true" />
                                    : <TrendingDown size={12} aria-hidden="true" />
                                }
                                {positive ? "+" : ""}{variation}%
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default BilanCard;
