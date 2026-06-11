import { useState, useEffect, useRef } from "react";
import {
    BarChart3, Users, Activity, XCircle, RotateCcw, MapPin, UserCheck,
    TrendingUp, Clock, Award, CheckCircle, Download, CalendarDays,
} from "lucide-react";
import {
    fetchStatisticsOverview,
    fetchStatisticsDrivers,
    fetchStatisticsActivity,
    fetchStatisticsFailures,
    fetchStatisticsReturns,
    fetchStatisticsGeography,
    fetchStatisticsClients,
    exportLivraisons,
    CACHE,
} from "../../../services/livraison.js";
import "../../../assets/styles/components/modules/livraison/Statistiques.css";

// ─── Navigation onglets stats ─────────────────────────────────────────────────

const STAT_TABS = [
    { id: "overview",   label: "Vue générale",  Icon: BarChart3   },
    { id: "drivers",    label: "Livreurs",      Icon: Users       },
    { id: "activity",   label: "Activité",      Icon: Activity    },
    { id: "failures",   label: "Échecs",        Icon: XCircle     },
    { id: "returns",    label: "Retours",       Icon: RotateCcw   },
    { id: "geography",  label: "Géographie",    Icon: MapPin      },
    { id: "clients",    label: "Clients",       Icon: UserCheck   },
];

// ─── CountUp ─────────────────────────────────────────────────────────────────

function CountUp({ to, decimals = 0, suffix = "" }) {
    const [val, setVal] = useState(0);
    const raf = useRef(null);

    useEffect(() => {
        if (!to && to !== 0) return;
        const start    = performance.now();
        const duration = 900;

        const tick = (now) => {
            const t    = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            setVal(+(to * ease).toFixed(decimals));
            if (t < 1) raf.current = requestAnimationFrame(tick);
        };

        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [to, decimals]);

    return <>{val.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>;
}

// ─── DateFilter ───────────────────────────────────────────────────────────────

function DateFilter({ dateDebut, dateFin, onChangeDebut, onChangeFin }) {
    const hasFilter = dateDebut || dateFin;
    return (
        <div className="stats-datefilter">
            <CalendarDays size={15} className="stats-datefilter__icon" aria-hidden="true" />
            <label className="stats-datefilter__label">
                <span>Du</span>
                <input
                    type="date"
                    className="stats-datefilter__input"
                    value={dateDebut}
                    onChange={e => onChangeDebut(e.target.value)}
                    max={dateFin || undefined}
                    aria-label="Date de début"
                />
            </label>
            <label className="stats-datefilter__label">
                <span>Au</span>
                <input
                    type="date"
                    className="stats-datefilter__input"
                    value={dateFin}
                    onChange={e => onChangeFin(e.target.value)}
                    min={dateDebut || undefined}
                    aria-label="Date de fin"
                />
            </label>
            {hasFilter && (
                <button
                    type="button"
                    className="stats-datefilter__btn"
                    onClick={() => { onChangeDebut(""); onChangeFin(""); }}
                >
                    Réinitialiser
                </button>
            )}
        </div>
    );
}

// ─── Stacked Bar Chart (SVG) ──────────────────────────────────────────────────

function StackedBarChart({ data, labelKey, height = 140 }) {
    const maxTotal = Math.max(...data.map(d => (d.livrees || 0) + (d.echecs || 0) + (d.retours || 0)), 1);

    return (
        <svg
            className="stats-chart__svg"
            viewBox={`0 0 ${data.length * 40} ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            {data.map((d, i) => {
                const total = (d.livrees || 0) + (d.echecs || 0) + (d.retours || 0);
                const h     = (total / maxTotal) * (height - 20);
                const xPos  = i * 40 + 4;
                const bw    = 32;
                const hL    = h * ((d.livrees || 0) / (total || 1));
                const hE    = h * ((d.echecs  || 0) / (total || 1));
                const hR    = h * ((d.retours || 0) / (total || 1));
                const base  = height - 18;

                return (
                    <g key={i}>
                        <rect x={xPos} y={base - hL}           width={bw} height={hL} fill="#27AE60" rx={2} />
                        <rect x={xPos} y={base - hL - hR}      width={bw} height={hR} fill="#F1C40F" rx={2} />
                        <rect x={xPos} y={base - hL - hR - hE} width={bw} height={hE} fill="#E74C3C" rx={2} />
                        <text x={xPos + bw / 2} y={height - 2} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
                            {d[labelKey]}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Horizontal Bar ───────────────────────────────────────────────────────────

function HorizontalBar({ value, max, color }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="stats-hbar">
            <div className="stats-hbar__track">
                <div className="stats-hbar__fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
}

// ─── Simple Bar Chart (SVG) ───────────────────────────────────────────────────

function SimpleBarChart({ data, labelKey, valueKey, color = "#27AE60", height = 120 }) {
    const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
    return (
        <svg
            className="stats-chart__svg"
            viewBox={`0 0 ${data.length * 40} ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            {data.map((d, i) => {
                const h    = ((d[valueKey] || 0) / max) * (height - 20);
                const xPos = i * 40 + 4;
                const bw   = 32;
                const base = height - 18;
                return (
                    <g key={i}>
                        <rect x={xPos} y={base - h} width={bw} height={h} fill={color} rx={2} />
                        <text x={xPos + bw / 2} y={height - 2} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
                            {d[labelKey]}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Donut Chart (SVG) ────────────────────────────────────────────────────────

function DonutChart({ items }) {
    const total = items.reduce((s, it) => s + (it.value || 0), 0);
    const r = 44; const cx = 56; const cy = 56;
    const circ = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div className="stats-donut">
            <svg className="stats-donut__svg" viewBox="0 0 112 112" aria-hidden="true">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={14} />
                {items.map((it, i) => {
                    const dash = (it.value / total) * circ;
                    const gap  = circ - dash;
                    const el = (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={it.color}
                            strokeWidth={14}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                        />
                    );
                    offset += dash;
                    return el;
                })}
            </svg>
            <ul className="stats-donut__legend">
                {items.map((it, i) => (
                    <li key={i} className="stats-donut__legend-item">
                        <span className="stats-donut__legend-dot" style={{ background: it.color }} />
                        <span className="stats-donut__legend-label">{it.label}</span>
                        <span className="stats-donut__legend-val">{it.value.toLocaleString("fr-FR")}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Skeleton commun ──────────────────────────────────────────────────────────

function StatsSkeleton() {
    return (
        <div className="stats-skeleton">
            <div className="stats-kpi-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="stats-kpi-card">
                        <div className="liv-skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
                        <div className="liv-skeleton" style={{ width: "60%", height: 28, marginTop: 8 }} />
                        <div className="liv-skeleton" style={{ width: "80%", height: 12, marginTop: 6 }} />
                    </div>
                ))}
            </div>
            <div className="stats-chart-card">
                <div className="liv-skeleton" style={{ width: "100%", height: 140, borderRadius: 8 }} />
            </div>
        </div>
    );
}

// ─── Section Vue Générale ─────────────────────────────────────────────────────

function VueGenerale() {
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin,   setDateFin]   = useState("");
    const [data,      setData]      = useState(() => CACHE.readStatisticsOverview({}));
    const [loading,   setLoading]   = useState(!CACHE.readStatisticsOverview({}));
    const [error,     setError]     = useState("");

    useEffect(() => {
        const params = {
            ...(dateDebut ? { date_debut: dateDebut } : {}),
            ...(dateFin   ? { date_fin:   dateFin   } : {}),
        };
        const stale = CACHE.readStatisticsOverview(params);
        if (stale) { setData(stale); setLoading(false); }
        else setLoading(true);

        fetchStatisticsOverview(params)
            .then(res => { setData(res); setLoading(false); setError(""); })
            .catch(err => { setError(err?.message ?? "Impossible de charger la vue générale."); setLoading(false); });
    }, [dateDebut, dateFin]);

    if (loading && !data) return <StatsSkeleton />;
    if (error && !data)   return <p className="stats-error">{error}</p>;
    if (!data)            return <StatsSkeleton />;

    const kpis = data?.kpis ?? {};
    const donutItems = [
        { label: "Livrées",  value: data?.repartitionStatuts?.livrees ?? 0, color: "#27AE60" },
        { label: "Échecs",   value: data?.repartitionStatuts?.echecs  ?? 0, color: "#E74C3C" },
        { label: "Retours",  value: data?.repartitionStatuts?.retours ?? 0, color: "#F1C40F" },
    ];

    return (
        <div className="stats-section">
            <DateFilter dateDebut={dateDebut} dateFin={dateFin} onChangeDebut={setDateDebut} onChangeFin={setDateFin} />
            {error && <p className="stats-error">{error}</p>}

            <div className="stats-kpi-grid">
                {[
                    { icon: <CheckCircle size={18} />, value: kpis.total,             label: "Total livraisons",     color: "#E8F8F1", iconColor: "#27AE60" },
                    { icon: <TrendingUp  size={18} />, value: kpis.successRate,       label: "Taux de réussite (%)", color: "#FFF8E1", iconColor: "#F39C12", dec: 1 },
                    { icon: <XCircle     size={18} />, value: kpis.failures,          label: "Échecs",               color: "#FEF0F0", iconColor: "#E74C3C" },
                    { icon: <RotateCcw   size={18} />, value: kpis.returns,           label: "Retours",              color: "#FFF8E1", iconColor: "#F1C40F" },
                    { icon: <Users       size={18} />, value: kpis.livreursActifs,    label: "Livreurs actifs",      color: "#EEF2FF", iconColor: "#5B6FBB" },
                    { icon: <Clock       size={18} />, value: kpis.tempsMoyenMinutes, label: "Temps moyen (min)",    color: "#F0F9FF", iconColor: "#0EA5E9" },
                ].map((k, i) => (
                    <div key={i} className="stats-kpi-card">
                        <div className="stats-kpi-card__icon" style={{ background: k.color }}>
                            <span style={{ color: k.iconColor }}>{k.icon}</span>
                        </div>
                        <p className="stats-kpi-card__value">
                            <CountUp to={k.value ?? 0} decimals={k.dec ?? 0} />
                        </p>
                        <p className="stats-kpi-card__label">{k.label}</p>
                    </div>
                ))}
            </div>

            <div className="stats-row">
                <div className="stats-chart-card stats-chart-card--flex">
                    <h3 className="stats-section-title">Évolution mensuelle</h3>
                    <div className="stats-chart-legend">
                        <span className="stats-chart-legend__dot" style={{ background: "#27AE60" }} /> Livrées
                        <span className="stats-chart-legend__dot" style={{ background: "#F1C40F" }} /> Retours
                        <span className="stats-chart-legend__dot" style={{ background: "#E74C3C" }} /> Échecs
                    </div>
                    <StackedBarChart data={data?.evolution ?? []} labelKey="mois" />
                </div>
                <div className="stats-chart-card stats-chart-card--donut">
                    <h3 className="stats-section-title">Répartition</h3>
                    <DonutChart items={donutItems} />
                </div>
            </div>
        </div>
    );
}

// ─── Section Livreurs ─────────────────────────────────────────────────────────

function PerformanceLivreurs() {
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin,   setDateFin]   = useState("");
    const [data,      setData]      = useState(() => CACHE.readStatisticsDrivers({}));
    const [loading,   setLoading]   = useState(!CACHE.readStatisticsDrivers({}));
    const [error,     setError]     = useState("");

    useEffect(() => {
        const params = {
            ...(dateDebut ? { date_debut: dateDebut } : {}),
            ...(dateFin   ? { date_fin:   dateFin   } : {}),
        };
        const stale = CACHE.readStatisticsDrivers(params);
        if (stale) { setData(stale); setLoading(false); }
        else setLoading(true);

        fetchStatisticsDrivers(params)
            .then(res => { setData(res); setLoading(false); setError(""); })
            .catch(err => { setError(err?.message ?? "Impossible de charger les performances."); setLoading(false); });
    }, [dateDebut, dateFin]);

    if (loading && !data) return <StatsSkeleton />;
    if (error && !data)   return <p className="stats-error">{error}</p>;
    if (!data)            return <StatsSkeleton />;

    const drivers = data?.data ?? [];
    const maxLiv  = Math.max(...drivers.map(d => d.livraisons), 1);

    return (
        <div className="stats-section">
            <DateFilter dateDebut={dateDebut} dateFin={dateFin} onChangeDebut={setDateDebut} onChangeFin={setDateFin} />
            {error && <p className="stats-error">{error}</p>}

            <div className="stats-highlights">
                {[
                    { label: "Meilleur taux", value: data?.meilleurLivreur, color: "#27AE60", Icon: Award      },
                    { label: "Plus rapide",   value: data?.plusRapide,      color: "#0EA5E9", Icon: TrendingUp  },
                    { label: "Plus actif",    value: data?.plusActif,       color: "#F39C12", Icon: Activity    },
                ].map((h, i) => (
                    <div key={i} className="stats-highlight-card">
                        <div className="stats-highlight-card__icon" style={{ background: h.color + "22" }}>
                            <h.Icon size={18} style={{ color: h.color }} aria-hidden="true" />
                        </div>
                        <div>
                            <p className="stats-highlight-card__label">{h.label}</p>
                            <p className="stats-highlight-card__value">{h.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="stats-table-wrap">
                <h3 className="stats-section-title">Détail des performances</h3>
                <div className="stats-table-scroll">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>Livreur</th>
                                <th>Volume</th>
                                <th>Taux (%)</th>
                                <th>Temps moy. (min)</th>
                                <th>Activité</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((d, i) => (
                                <tr key={d.id} className={i === 0 ? "stats-table__row--first" : ""}>
                                    <td className="stats-table__name">{d.nom}</td>
                                    <td>{d.livraisons.toLocaleString("fr-FR")}</td>
                                    <td>
                                        <span className={`stats-rate ${d.successRate >= 95 ? "stats-rate--high" : d.successRate >= 90 ? "stats-rate--mid" : "stats-rate--low"}`}>
                                            {d.successRate.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td>{d.tempsMoyenMin} min</td>
                                    <td style={{ width: 120 }}>
                                        <HorizontalBar value={d.livraisons} max={maxLiv} color="#F39C12" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Section Activité ─────────────────────────────────────────────────────────

function AnalyseActivite() {
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin,   setDateFin]   = useState("");
    const [data,      setData]      = useState(() => CACHE.readStatisticsActivity({}));
    const [loading,   setLoading]   = useState(!CACHE.readStatisticsActivity({}));
    const [error,     setError]     = useState("");
    const [period,    setPeriod]    = useState("jour");

    useEffect(() => {
        const params = {
            ...(dateDebut ? { date_debut: dateDebut } : {}),
            ...(dateFin   ? { date_fin:   dateFin   } : {}),
        };
        const stale = CACHE.readStatisticsActivity(params);
        if (stale) { setData(stale); setLoading(false); }
        else setLoading(true);

        fetchStatisticsActivity(params)
            .then(res => { setData(res); setLoading(false); setError(""); })
            .catch(err => { setError(err?.message ?? "Impossible de charger les données d'activité."); setLoading(false); });
    }, [dateDebut, dateFin]);

    if (loading && !data) return <StatsSkeleton />;
    if (error && !data)   return <p className="stats-error">{error}</p>;
    if (!data)            return <StatsSkeleton />;

    const chartData = {
        jour:    { data: data?.parJour ?? [],    labelKey: "jour",    multi: true  },
        semaine: { data: data?.parSemaine ?? [], labelKey: "semaine", multi: true  },
        mois:    { data: data?.parMois ?? [],    labelKey: "mois",    multi: false },
    }[period];

    const heatmax = Math.max(...(data?.joursActifs ?? []).map(d => d.count), 1);

    return (
        <div className="stats-section">
            <DateFilter dateDebut={dateDebut} dateFin={dateFin} onChangeDebut={setDateDebut} onChangeFin={setDateFin} />
            {error && <p className="stats-error">{error}</p>}

            <div className="stats-pills">
                {[["jour", "Par jour"], ["semaine", "Par semaine"], ["mois", "Par mois"]].map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        className={`stats-pill${period === id ? " stats-pill--active" : ""}`}
                        onClick={() => setPeriod(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="stats-chart-card">
                <h3 className="stats-section-title">
                    {period === "jour" ? "Activité cette semaine" : period === "semaine" ? "Activité par semaine" : "Livraisons par mois"}
                </h3>
                {chartData.multi ? (
                    <>
                        <div className="stats-chart-legend">
                            <span className="stats-chart-legend__dot" style={{ background: "#27AE60" }} /> Livrées
                            <span className="stats-chart-legend__dot" style={{ background: "#F1C40F" }} /> Retours
                            <span className="stats-chart-legend__dot" style={{ background: "#E74C3C" }} /> Échecs
                        </div>
                        <StackedBarChart data={chartData.data} labelKey={chartData.labelKey} />
                    </>
                ) : (
                    <SimpleBarChart data={chartData.data} labelKey="mois" valueKey="livrees" color="#27AE60" />
                )}
            </div>

            <div className="stats-chart-card">
                <h3 className="stats-section-title">Activité récente (8 derniers jours)</h3>
                <div className="stats-heatmap">
                    {(data?.joursActifs ?? []).map((d, i) => {
                        const intensity = d.count / heatmax;
                        const date      = new Date(d.date);
                        const dayLabel  = date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
                        return (
                            <div key={i} className="stats-heatmap__cell" title={`${dayLabel} : ${d.count} livraisons`}>
                                <div className="stats-heatmap__block" style={{ opacity: 0.15 + intensity * 0.85 }} />
                                <span className="stats-heatmap__label">{dayLabel}</span>
                                <span className="stats-heatmap__count">{d.count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Section Échecs ───────────────────────────────────────────────────────────

function AnalyseEchecs() {
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin,   setDateFin]   = useState("");
    const [data,      setData]      = useState(() => CACHE.readStatisticsFailures({}));
    const [loading,   setLoading]   = useState(!CACHE.readStatisticsFailures({}));
    const [error,     setError]     = useState("");

    useEffect(() => {
        const params = {
            ...(dateDebut ? { date_debut: dateDebut } : {}),
            ...(dateFin   ? { date_fin:   dateFin   } : {}),
        };
        const stale = CACHE.readStatisticsFailures(params);
        if (stale) { setData(stale); setLoading(false); }
        else setLoading(true);

        fetchStatisticsFailures(params)
            .then(res => { setData(res); setLoading(false); setError(""); })
            .catch(err => { setError(err?.message ?? "Impossible de charger l'analyse des échecs."); setLoading(false); });
    }, [dateDebut, dateFin]);

    if (loading && !data) return <StatsSkeleton />;
    if (error && !data)   return <p className="stats-error">{error}</p>;
    if (!data)            return <StatsSkeleton />;

    const kpis   = data?.kpis ?? {};
    const motifs = data?.data ?? [];

    return (
        <div className="stats-section">
            <DateFilter dateDebut={dateDebut} dateFin={dateFin} onChangeDebut={setDateDebut} onChangeFin={setDateFin} />
            {error && <p className="stats-error">{error}</p>}

            <div className="stats-kpi-grid stats-kpi-grid--4">
                {[
                    { label: "Total échecs",       value: kpis.total,              color: "#FEF0F0", iconColor: "#E74C3C", Icon: XCircle,   dec: 0 },
                    { label: "Taux d'échec (%)",    value: kpis.taux,               color: "#FEF0F0", iconColor: "#E74C3C", Icon: TrendingUp, dec: 2 },
                    { label: "Clients absents",     value: kpis.clientsAbsents,     color: "#FFF8F0", iconColor: "#F39C12", Icon: Users,      dec: 0 },
                    { label: "Adresse incorrecte",  value: kpis.adresseIncorrecte,  color: "#FFF8F0", iconColor: "#F39C12", Icon: MapPin,     dec: 0 },
                ].map((k, i) => (
                    <div key={i} className="stats-kpi-card">
                        <div className="stats-kpi-card__icon" style={{ background: k.color }}>
                            <k.Icon size={18} style={{ color: k.iconColor }} aria-hidden="true" />
                        </div>
                        <p className="stats-kpi-card__value"><CountUp to={k.value ?? 0} decimals={k.dec} /></p>
                        <p className="stats-kpi-card__label">{k.label}</p>
                    </div>
                ))}
            </div>

            <div className="stats-chart-card">
                <h3 className="stats-section-title">Motifs d'échec</h3>
                <div className="stats-motifs">
                    {motifs.map((m, i) => (
                        <div key={i} className="stats-motif-row">
                            <div className="stats-motif-row__header">
                                <span className="stats-motif-row__label">{m.motif}</span>
                                <span className="stats-motif-row__count">{m.count} ({m.pourcentage}%)</span>
                            </div>
                            <HorizontalBar value={m.pourcentage} max={100} color="#E74C3C" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Section Retours ──────────────────────────────────────────────────────────

function AnalyseRetours() {
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin,   setDateFin]   = useState("");
    const [data,      setData]      = useState(() => CACHE.readStatisticsReturns({}));
    const [loading,   setLoading]   = useState(!CACHE.readStatisticsReturns({}));
    const [error,     setError]     = useState("");

    useEffect(() => {
        const params = {
            ...(dateDebut ? { date_debut: dateDebut } : {}),
            ...(dateFin   ? { date_fin:   dateFin   } : {}),
        };
        const stale = CACHE.readStatisticsReturns(params);
        if (stale) { setData(stale); setLoading(false); }
        else setLoading(true);

        fetchStatisticsReturns(params)
            .then(res => { setData(res); setLoading(false); setError(""); })
            .catch(err => { setError(err?.message ?? "Impossible de charger l'analyse des retours."); setLoading(false); });
    }, [dateDebut, dateFin]);

    if (loading && !data) return <StatsSkeleton />;
    if (error && !data)   return <p className="stats-error">{error}</p>;
    if (!data)            return <StatsSkeleton />;

    const kpis   = data?.kpis  ?? {};
    const motifs = data?.data  ?? [];

    return (
        <div className="stats-section">
            <DateFilter dateDebut={dateDebut} dateFin={dateFin} onChangeDebut={setDateDebut} onChangeFin={setDateFin} />
            {error && <p className="stats-error">{error}</p>}

            <div className="stats-kpi-grid stats-kpi-grid--3">
                {[
                    { label: "Total retours",        value: kpis.total,              color: "#FFF8E1", iconColor: "#F1C40F", Icon: RotateCcw },
                    { label: "Refus client",          value: kpis.refusClient,        color: "#FFF8F0", iconColor: "#F39C12", Icon: XCircle   },
                    { label: "Produit non conforme",  value: kpis.produitNonConforme, color: "#FEF0F0", iconColor: "#E74C3C", Icon: XCircle   },
                ].map((k, i) => (
                    <div key={i} className="stats-kpi-card">
                        <div className="stats-kpi-card__icon" style={{ background: k.color }}>
                            <k.Icon size={18} style={{ color: k.iconColor }} aria-hidden="true" />
                        </div>
                        <p className="stats-kpi-card__value"><CountUp to={k.value ?? 0} /></p>
                        <p className="stats-kpi-card__label">{k.label}</p>
                    </div>
                ))}
            </div>

            <div className="stats-chart-card">
                <h3 className="stats-section-title">Motifs de retour</h3>
                <div className="stats-motifs">
                    {motifs.map((m, i) => (
                        <div key={i} className="stats-motif-row">
                            <div className="stats-motif-row__header">
                                <span className="stats-motif-row__label">{m.motif}</span>
                                <span className="stats-motif-row__count">{m.count} ({m.pourcentage}%)</span>
                            </div>
                            <HorizontalBar value={m.pourcentage} max={100} color="#F1C40F" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Section Géographie ───────────────────────────────────────────────────────

function AnalyseGeographie() {
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin,   setDateFin]   = useState("");
    const [data,      setData]      = useState(() => CACHE.readStatisticsGeography({}));
    const [loading,   setLoading]   = useState(!CACHE.readStatisticsGeography({}));
    const [error,     setError]     = useState("");

    useEffect(() => {
        const params = {
            ...(dateDebut ? { date_debut: dateDebut } : {}),
            ...(dateFin   ? { date_fin:   dateFin   } : {}),
        };
        const stale = CACHE.readStatisticsGeography(params);
        if (stale) { setData(stale); setLoading(false); }
        else setLoading(true);

        fetchStatisticsGeography(params)
            .then(res => { setData(res); setLoading(false); setError(""); })
            .catch(err => { setError(err?.message ?? "Impossible de charger l'analyse géographique."); setLoading(false); });
    }, [dateDebut, dateFin]);

    if (loading && !data) return <StatsSkeleton />;
    if (error && !data)   return <p className="stats-error">{error}</p>;
    if (!data)            return <StatsSkeleton />;

    const kpis   = data?.kpis ?? {};
    const villes = data?.data ?? [];
    const maxLiv = Math.max(...villes.map(v => v.livraisons), 1);

    return (
        <div className="stats-section">
            <DateFilter dateDebut={dateDebut} dateFin={dateFin} onChangeDebut={setDateDebut} onChangeFin={setDateFin} />
            {error && <p className="stats-error">{error}</p>}

            <div className="stats-highlights">
                {[
                    { label: "Ville la plus active",  value: kpis.villeActive,    color: "#27AE60", Icon: Activity  },
                    { label: "Zone difficile",          value: kpis.villeDifficile, color: "#E74C3C", Icon: XCircle   },
                    { label: "Zone la plus rentable",  value: kpis.villeRentable,  color: "#F39C12", Icon: Award     },
                ].map((h, i) => (
                    <div key={i} className="stats-highlight-card">
                        <div className="stats-highlight-card__icon" style={{ background: h.color + "22" }}>
                            <h.Icon size={18} style={{ color: h.color }} aria-hidden="true" />
                        </div>
                        <div>
                            <p className="stats-highlight-card__label">{h.label}</p>
                            <p className="stats-highlight-card__value">{h.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="stats-chart-card">
                <h3 className="stats-section-title">Volume par ville</h3>
                <SimpleBarChart data={villes} labelKey="ville" valueKey="livraisons" color="#0EA5E9" height={140} />
            </div>

            <div className="stats-table-wrap">
                <h3 className="stats-section-title">Détail géographique</h3>
                <div className="stats-table-scroll">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>Ville</th>
                                <th>Livraisons</th>
                                <th>Succès</th>
                                <th>Échecs</th>
                                <th>Retours</th>
                                <th>Activité</th>
                            </tr>
                        </thead>
                        <tbody>
                            {villes.map((v, i) => (
                                <tr key={i}>
                                    <td className="stats-table__name">{v.ville}</td>
                                    <td>{v.livraisons.toLocaleString("fr-FR")}</td>
                                    <td className="stats-table__success">{v.succes.toLocaleString("fr-FR")}</td>
                                    <td className="stats-table__fail">{v.echecs}</td>
                                    <td className="stats-table__return">{v.retours}</td>
                                    <td style={{ width: 120 }}>
                                        <HorizontalBar value={v.livraisons} max={maxLiv} color="#0EA5E9" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Section Clients ──────────────────────────────────────────────────────────

function AnalyseClients() {
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin,   setDateFin]   = useState("");
    const [data,      setData]      = useState(() => CACHE.readStatisticsClients({}));
    const [loading,   setLoading]   = useState(!CACHE.readStatisticsClients({}));
    const [error,     setError]     = useState("");

    useEffect(() => {
        const params = {
            ...(dateDebut ? { date_debut: dateDebut } : {}),
            ...(dateFin   ? { date_fin:   dateFin   } : {}),
        };
        const stale = CACHE.readStatisticsClients(params);
        if (stale) { setData(stale); setLoading(false); }
        else setLoading(true);

        fetchStatisticsClients(params)
            .then(res => { setData(res); setLoading(false); setError(""); })
            .catch(err => { setError(err?.message ?? "Impossible de charger l'analyse clients."); setLoading(false); });
    }, [dateDebut, dateFin]);

    if (loading && !data) return <StatsSkeleton />;
    if (error && !data)   return <p className="stats-error">{error}</p>;
    if (!data)            return <StatsSkeleton />;

    const kpis    = data?.kpis ?? {};
    const clients = data?.data ?? [];

    return (
        <div className="stats-section">
            <DateFilter dateDebut={dateDebut} dateFin={dateFin} onChangeDebut={setDateDebut} onChangeFin={setDateFin} />
            {error && <p className="stats-error">{error}</p>}

            <div className="stats-highlights">
                {[
                    { label: "Client le plus livré",  value: kpis.clientPlusLivre,   color: "#27AE60", Icon: Award     },
                    { label: "Plus de retours",         value: kpis.clientPlusRetours, color: "#E74C3C", Icon: RotateCcw },
                    { label: "Client fidèle",           value: kpis.clientPlusFidele,  color: "#0EA5E9", Icon: UserCheck },
                ].map((h, i) => (
                    <div key={i} className="stats-highlight-card">
                        <div className="stats-highlight-card__icon" style={{ background: h.color + "22" }}>
                            <h.Icon size={18} style={{ color: h.color }} aria-hidden="true" />
                        </div>
                        <div>
                            <p className="stats-highlight-card__label">{h.label}</p>
                            <p className="stats-highlight-card__value">{h.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="stats-table-wrap">
                <h3 className="stats-section-title">Top clients</h3>
                <div className="stats-table-scroll">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Commandes</th>
                                <th>Livrées</th>
                                <th>Retours</th>
                                <th>Échecs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((c, i) => (
                                <tr key={i}>
                                    <td className="stats-table__name">{c.client}</td>
                                    <td>{c.commandes}</td>
                                    <td className="stats-table__success">{c.livraisons}</td>
                                    <td className="stats-table__return">{c.retours}</td>
                                    <td className="stats-table__fail">{c.echecs}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Composant principal Statistiques ────────────────────────────────────────

const SECTION_MAP = {
    overview:  VueGenerale,
    drivers:   PerformanceLivreurs,
    activity:  AnalyseActivite,
    failures:  AnalyseEchecs,
    returns:   AnalyseRetours,
    geography: AnalyseGeographie,
    clients:   AnalyseClients,
};

function Statistiques() {
    const [activeTab, setActiveTab] = useState("overview");
    const [exporting, setExporting] = useState(false);
    const [exportMsg, setExportMsg] = useState("");

    const ActiveSection = SECTION_MAP[activeTab];

    const handleExport = async (format) => {
        setExporting(true);
        try {
            const res = await exportLivraisons(format);
            setExportMsg(res?.message ?? "Export réalisé.");
        } catch {
            setExportMsg("Export non encore disponible.");
        } finally {
            setExporting(false);
            setTimeout(() => setExportMsg(""), 3000);
        }
    };

    return (
        <div className="stats-root">
            {/* Navigation onglets */}
            <div className="stats-nav" role="tablist" aria-label="Sections statistiques">
                <div className="stats-nav__inner">
                    {STAT_TABS.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === id}
                            className={`stats-nav__tab${activeTab === id ? " stats-nav__tab--active" : ""}`}
                            onClick={() => setActiveTab(id)}
                        >
                            <Icon size={15} aria-hidden="true" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Export rapide */}
            <div className="stats-toolbar">
                <div className="stats-export">
                    <Download size={15} aria-hidden="true" />
                    <span>Rapport</span>
                    {["pdf", "csv", "docx"].map(f => (
                        <button key={f} type="button" className="stats-export__btn" onClick={() => handleExport(f)} disabled={exporting}>
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
                {exportMsg && <span className="stats-export__msg">{exportMsg}</span>}
            </div>

            {/* Section active */}
            <div role="tabpanel" aria-label={STAT_TABS.find(t => t.id === activeTab)?.label}>
                <ActiveSection />
            </div>
        </div>
    );
}

export default Statistiques;
