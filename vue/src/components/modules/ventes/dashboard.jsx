import { useState, useMemo } from "react";
import {
    ShoppingCart, Inbox, CheckCircle, Truck, PackageCheck,
    XCircle, Users, TrendingUp, AlertTriangle, Package, CreditCard,
    RefreshCw, Plus, CheckSquare, ArrowRight,
} from "lucide-react";
import { formatMontant, fetchVentesDashboard } from "../../../services/ventes.js";
import { useStockData } from "../../../services/useStockData.js";
import "../../../assets/styles/components/modules/ventes/dashboard.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShort(val) {
    if (val == null || isNaN(val)) return "0";
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000)     return `${Math.round(val / 1_000)}K`;
    return String(val);
}

function formatDateShort(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jui","Jul","Aoû","Sep","Oct","Nov","Déc"];
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return "";
    const d   = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffH  = Math.floor(diffMs / 3_600_000);
    if (diffH < 1)  return "Il y a moins d'1 h";
    if (diffH < 24) return `Il y a ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "Hier";
    return `Il y a ${diffD} jours`;
}

// ─── Config types activités ────────────────────────────────────────────────────

const ACTIVITY_CONFIG = {
    commande_creee:    { label: "Créée",    Icon: Plus,         color: "info"    },
    commande_validee:  { label: "Validée",  Icon: CheckSquare,  color: "success" },
    paiement_recu:     { label: "Paiement", Icon: CreditCard,   color: "primary" },
    livraison_lancee:  { label: "Lancée",   Icon: Truck,        color: "warning" },
    livraison_terminee:{ label: "Livrée",   Icon: PackageCheck, color: "success" },
};

// ─── Config KPIs ──────────────────────────────────────────────────────────────

const KPI_DESKTOP = [
    { key: "total_commandes",    label: "Total commandes",   Icon: ShoppingCart, variant: "primary"  },
    { key: "commandes_recues",   label: "Reçues",            Icon: Inbox,        variant: "info"     },
    { key: "commandes_validees", label: "Validées",          Icon: CheckCircle,  variant: "success"  },
    { key: "livraisons_en_cours",label: "En livraison",      Icon: Truck,        variant: "warning"  },
    { key: "commandes_livrees",  label: "Livrées",           Icon: PackageCheck, variant: "success"  },
    { key: "commandes_annulees", label: "Annulées",          Icon: XCircle,      variant: "danger"   },
    { key: "clients",            label: "Clients actifs",    Icon: Users,        variant: "accent"   },
    { key: "ca_total",           label: "CA total",          Icon: TrendingUp,   variant: "primary",  format: "montant" },
];

// Sur mobile : 4 KPIs essentiels
const KPI_MOBILE_KEYS = ["total_commandes", "ca_total", "clients", "livraisons_en_cours"];


// ─── Composant principal ───────────────────────────────────────────────────────

function Dashboard() {
    const { data, loading, error, refresh: retry } = useStockData(fetchVentesDashboard, "ventes-dashboard");
    const [chartPeriod, setChartPeriod]   = useState("30j");

    if (loading) return <DashboardSkeleton />;
    if (error)   return <DashboardError message={error} onRetry={retry} />;
    if (!data)   return null;

    return (
        <section className="dashboard-root" aria-label="Tableau de bord — Ventes">

            {/* ── En-tête ── */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-header__title">Tableau de bord</h1>
                    <p className="dashboard-header__sub">
                        Aujourd'hui · <time dateTime="2026-06-05">5 juin 2026</time>
                    </p>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="dashboard-kpis" role="region" aria-label="Indicateurs clés">
                {KPI_DESKTOP.map(({ key, label, Icon, variant, format }) => {
                    const isMobileHidden = !KPI_MOBILE_KEYS.includes(key);
                    const rawVal = data.stats[key] ?? 0;
                    const displayVal = format === "montant" ? formatMontant(rawVal) : rawVal.toLocaleString("fr-FR");
                    return (
                        <div
                            key={key}
                            className={`dashboard-kpi dashboard-kpi--${variant}${isMobileHidden ? " dashboard-kpi--desktop-only" : ""}`}
                        >
                            <div className={`dashboard-kpi__icon dashboard-kpi__icon--${variant}`}>
                                <Icon size={20} aria-hidden="true" />
                            </div>
                            <span className="dashboard-kpi__value">{displayVal}</span>
                            <span className="dashboard-kpi__label">{label}</span>
                        </div>
                    );
                })}
            </div>

            {/* ── Ligne 2 : Graphique + Alertes ── */}
            <div className="dashboard-row2">
                <div className="dashboard-row2__chart">
                    <CaChart data={data.courbe_ca} period={chartPeriod} onPeriodChange={setChartPeriod} />
                </div>
                <div className="dashboard-row2__alerts">
                    <AlertesSection alertes={data.alertes} />
                </div>
            </div>

            {/* ── Ligne 3 : Activité + Top clients ── */}
            <div className="dashboard-row3">
                <div className="dashboard-row3__activity">
                    <ActivitySection activites={data.activites} />
                </div>
                <div className="dashboard-row3__clients">
                    <TopClientsSection topClients={data.top_clients} maxCa={data.top_clients[0]?.ca_total ?? 1} />
                </div>
            </div>

        </section>
    );
}

// ─── Graphique CA (SVG natif) ──────────────────────────────────────────────────

function CaChart({ data, period, onPeriodChange }) {
    const PERIODS = { "7j": 7, "30j": 30, "90j": 90 };

    const chartData = useMemo(() => {
        const n = PERIODS[period] ?? 30;
        return data.slice(-n);
    }, [data, period]);

    // SVG coordinate space
    const VW = 600, VH = 200;
    const PAD = { top: 20, right: 16, bottom: 40, left: 68 };
    const plotW = VW - PAD.left - PAD.right;
    const plotH = VH - PAD.top  - PAD.bottom;

    const maxVal = Math.max(...chartData.map((d) => d.montant), 1);

    const xScale = (i) => PAD.left + (i / Math.max(chartData.length - 1, 1)) * plotW;
    const yScale = (v) => PAD.top  + plotH * (1 - v / maxVal);

    const linePoints  = chartData.map((d, i) => `${xScale(i)},${yScale(d.montant)}`).join(" ");
    const lastX = xScale(chartData.length - 1);
    const lastY = yScale(chartData[chartData.length - 1]?.montant ?? 0);
    const areaPath = `M ${PAD.left},${PAD.top + plotH} L ${linePoints.replace(/ /g, " L ")} L ${lastX},${PAD.top + plotH} Z`;

    // Y-axis ticks
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
        y:   yScale(maxVal * t),
        val: maxVal * t,
    }));

    // X-axis labels (max 6)
    const step = Math.ceil(chartData.length / 6);
    const xLabels = chartData
        .map((d, i) => ({ i, d }))
        .filter((_, i) => i === 0 || (i + 1) % step === 0 || i === chartData.length - 1);

    return (
        <div className="dashboard-chart">
            <div className="dashboard-chart__header">
                <span className="dashboard-chart__title">Chiffre d'affaires</span>
                <div className="dashboard-chart__tabs" role="tablist" aria-label="Période">
                    {Object.keys(PERIODS).map((p) => (
                        <button
                            key={p}
                            className={`dashboard-chart__tab${period === p ? " dashboard-chart__tab--active" : ""}`}
                            onClick={() => onPeriodChange(p)}
                            role="tab"
                            aria-selected={period === p}
                            type="button"
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            <div className="dashboard-chart__wrap">
                <svg
                    viewBox={`0 0 ${VW} ${VH}`}
                    className="dashboard-chart__svg"
                    aria-label={`Graphique CA — ${period}`}
                    role="img"
                >
                    <defs>
                        <linearGradient id="dashCaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#F39C12" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#F39C12" stopOpacity="0"    />
                        </linearGradient>
                    </defs>

                    {/* Grille horizontale */}
                    {yTicks.map((t, i) => (
                        <line
                            key={i}
                            x1={PAD.left} y1={t.y}
                            x2={PAD.left + plotW} y2={t.y}
                            stroke="#E5D9CE"
                            strokeWidth="1"
                            strokeDasharray={i === 0 ? "none" : "4 4"}
                        />
                    ))}

                    {/* Aire de remplissage */}
                    <path d={areaPath} fill="url(#dashCaGrad)" />

                    {/* Ligne */}
                    <polyline
                        points={linePoints}
                        fill="none"
                        stroke="#F39C12"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* Point final */}
                    <circle cx={lastX} cy={lastY} r="5" fill="#F39C12" stroke="white" strokeWidth="2" />

                    {/* Labels Y */}
                    {yTicks.filter((_, i) => i > 0).map((t, i) => (
                        <text
                            key={i}
                            x={PAD.left - 6}
                            y={t.y + 4}
                            textAnchor="end"
                            fontSize="11"
                            fill="#9CA3AF"
                            fontFamily="Inter, sans-serif"
                        >
                            {formatShort(t.val)}
                        </text>
                    ))}

                    {/* Labels X */}
                    {xLabels.map(({ i, d }) => (
                        <text
                            key={i}
                            x={xScale(i)}
                            y={VH - 8}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#9CA3AF"
                            fontFamily="Inter, sans-serif"
                        >
                            {formatDateShort(d.date)}
                        </text>
                    ))}
                </svg>
            </div>
        </div>
    );
}

// ─── Section Alertes ───────────────────────────────────────────────────────────

function AlertesSection({ alertes }) {
    const ALERTE_ICON = {
        stock:    Package,
        commande: ShoppingCart,
        paiement: CreditCard,
    };

    return (
        <div className="dashboard-alerts">
            <h2 className="dashboard-section__title">Alertes</h2>
            {alertes.length === 0 ? (
                <div className="dashboard-alerts__empty">
                    <CheckCircle size={24} aria-hidden="true" />
                    <span>Aucune alerte active.</span>
                </div>
            ) : (
                <div className="dashboard-alerts__list">
                    {alertes.map((a) => {
                        const Icon = ALERTE_ICON[a.type] ?? AlertTriangle;
                        return (
                            <div
                                key={a.id}
                                className={`dashboard-alerts__item dashboard-alerts__item--${a.niveau}`}
                            >
                                <Icon size={16} className="dashboard-alerts__item-icon" aria-hidden="true" />
                                <p className="dashboard-alerts__item-msg">{a.message}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Section Activité récente ──────────────────────────────────────────────────

function ActivitySection({ activites }) {
    return (
        <div className="dashboard-activity">
            <div className="dashboard-section__header">
                <h2 className="dashboard-section__title">Activité récente</h2>
            </div>
            <div className="dashboard-activity__list">
                {activites.map((a, idx) => {
                    const cfg = ACTIVITY_CONFIG[a.type] ?? {
                        label: "Événement",
                        Icon: ArrowRight,
                        color: "neutral",
                    };
                    const { Icon } = cfg;
                    return (
                        <div key={a.id} className="dashboard-activity__item">
                            {/* Ligne verticale */}
                            <div className="dashboard-activity__track">
                                <div className={`dashboard-activity__dot dashboard-activity__dot--${cfg.color}`}>
                                    <Icon size={12} aria-hidden="true" />
                                </div>
                                {idx < activites.length - 1 && (
                                    <div className="dashboard-activity__line" aria-hidden="true" />
                                )}
                            </div>
                            <div className="dashboard-activity__content">
                                <p className="dashboard-activity__desc">{a.description}</p>
                                <time
                                    dateTime={a.date}
                                    className="dashboard-activity__time"
                                >
                                    {formatRelativeTime(a.date)}
                                </time>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Section Top Clients ───────────────────────────────────────────────────────

function TopClientsSection({ topClients, maxCa }) {
    return (
        <div className="dashboard-topClients">
            <h2 className="dashboard-section__title">Top clients</h2>
            <div className="dashboard-topClients__list">
                {topClients.map((c, idx) => (
                    <div key={c.id} className="dashboard-topClients__item">
                        <span className="dashboard-topClients__rank">#{idx + 1}</span>
                        <div className="dashboard-topClients__avatar" aria-hidden="true">
                            {c.initiales}
                        </div>
                        <div className="dashboard-topClients__info">
                            <span className="dashboard-topClients__name">{c.nom}</span>
                            <span className="dashboard-topClients__orders">
                                {c.total_commandes} commande{c.total_commandes > 1 ? "s" : ""}
                            </span>
                            {/* Barre de progression proportionnelle */}
                            <div className="dashboard-topClients__bar-wrap">
                                <div
                                    className="dashboard-topClients__bar"
                                    style={{ width: `${Math.round((c.ca_total / maxCa) * 100)}%` }}
                                    role="progressbar"
                                    aria-valuenow={c.ca_total}
                                    aria-valuemin={0}
                                    aria-valuemax={maxCa}
                                />
                            </div>
                        </div>
                        <span className="dashboard-topClients__ca">{formatMontant(c.ca_total)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
    return (
        <section className="dashboard-root" aria-busy="true" aria-label="Chargement du tableau de bord">
            <div className="dashboard-header">
                <div>
                    <div className="ventes-skeleton dashboard-skeleton__title" />
                    <div className="ventes-skeleton dashboard-skeleton__sub" />
                </div>
            </div>

            {/* KPIs skeleton */}
            <div className="dashboard-kpis">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="dashboard-kpi dashboard-kpi--skeleton">
                        <div className="ventes-skeleton dashboard-skeleton__kpi-icon" />
                        <div className="ventes-skeleton dashboard-skeleton__kpi-value" />
                        <div className="ventes-skeleton dashboard-skeleton__kpi-label" />
                    </div>
                ))}
            </div>

            {/* Chart skeleton */}
            <div className="dashboard-row2">
                <div className="dashboard-row2__chart">
                    <div className="dashboard-chart">
                        <div className="dashboard-chart__header">
                            <div className="ventes-skeleton" style={{ width: 140, height: 18, borderRadius: 6 }} />
                        </div>
                        <div className="ventes-skeleton dashboard-skeleton__chart" />
                    </div>
                </div>
                <div className="dashboard-row2__alerts">
                    <div className="ventes-skeleton" style={{ height: 100, borderRadius: 12 }} />
                </div>
            </div>
        </section>
    );
}

// ─── État erreur ───────────────────────────────────────────────────────────────

function DashboardError({ message, onRetry }) {
    return (
        <section className="dashboard-root" aria-live="assertive">
            <div className="dashboard-error">
                <div className="dashboard-error__icon">
                    <AlertTriangle size={32} aria-hidden="true" />
                </div>
                <h2 className="dashboard-error__title">Impossible de charger le tableau de bord</h2>
                <p className="dashboard-error__message">{message}</p>
                <button
                    className="app-button app-button--primary"
                    onClick={onRetry}
                    type="button"
                >
                    <RefreshCw size={16} aria-hidden="true" />
                    Réessayer
                </button>
            </div>
        </section>
    );
}

export default Dashboard;
