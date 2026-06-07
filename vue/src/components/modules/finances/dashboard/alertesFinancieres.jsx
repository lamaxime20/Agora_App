import { AlertTriangle, AlertCircle, Info, ChevronRight } from "lucide-react";

const TYPE_CONFIG = {
    warning: { icon: AlertTriangle, cls: "warning" },
    danger:  { icon: AlertCircle,   cls: "danger"  },
    info:    { icon: Info,          cls: "info"    },
};

function AlertesFinancieres({ loading, alertes }) {
    if (loading) {
        return (
            <div className="finDash-alertes">
                <div className="finDash-skeleton finDash-skeleton--title" style={{ marginBottom: "var(--space-3)" }} />
                {[1, 2, 3].map(i => (
                    <div key={i} className="finDash-alerte--skeleton">
                        <div className="finDash-skeleton finDash-skeleton--icon" />
                        <div className="finDash-alerte__body--skeleton">
                            <div className="finDash-skeleton finDash-skeleton--line" />
                            <div className="finDash-skeleton finDash-skeleton--label" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const list = alertes ?? [];

    if (list.length === 0) return null;

    return (
        <section className="finDash-alertes" aria-label="Alertes financières">
            <p className="finDash-alertes__title">Alertes financières</p>
            <div className="finDash-alertes__grid">
                {list.map(alerte => {
                    const cfg = TYPE_CONFIG[alerte.type] ?? TYPE_CONFIG.info;
                    const Icon = cfg.icon;
                    return (
                        <article key={alerte.id} className={`finDash-alerte finDash-alerte--${cfg.cls}`}>
                            <div className="finDash-alerte__icon">
                                <Icon size={18} aria-hidden="true" />
                            </div>
                            <div className="finDash-alerte__body">
                                <p className="finDash-alerte__titre">{alerte.titre}</p>
                                <p className="finDash-alerte__detail">{alerte.detail}</p>
                            </div>
                            <div className="finDash-alerte__count">
                                <span>{alerte.count}</span>
                            </div>
                            <ChevronRight size={16} className="finDash-alerte__arrow" aria-hidden="true" />
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export default AlertesFinancieres;
