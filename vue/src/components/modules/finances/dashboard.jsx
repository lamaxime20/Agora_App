import { useState, useEffect } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

import { fetchDashboard } from "../../../services/financesDashboard.js";
import { readCache } from "../../../services/financesCache.js";
import ArgentVirtuelCard  from "./dashboard/argentVirtuelCard.jsx";
import BilanCard          from "./dashboard/bilanCard.jsx";
import KpiCards           from "./dashboard/kpiCards.jsx";
import GraphiqueTresorerie from "./dashboard/graphiqueTresorerie.jsx";
import ActiviteRecente    from "./dashboard/activiteRecente.jsx";
import AlertesFinancieres from "./dashboard/alertesFinancieres.jsx";

import "../../../assets/styles/components/modules/finances/dashboard.css";

function ErrorState({ onRetry }) {
    return (
        <div className="finDash-error">
            <AlertCircle size={40} aria-hidden="true" />
            <p className="finDash-error__title">Impossible de charger le tableau de bord</p>
            <p className="finDash-error__desc">Vérifiez votre connexion et réessayez.</p>
            <button className="app-button app-button--primary" onClick={onRetry} type="button">
                <RefreshCw size={16} aria-hidden="true" />
                Réessayer
            </button>
        </div>
    );
}

function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);
    const [payload, setPayload] = useState(null);

    const charger = () => {
        setLoading(true);
        setError(null);
        const donneesCache = readCache("fin-dashboard");
        if (donneesCache) {
            setPayload(donneesCache);
            setLoading(false);
        }
        fetchDashboard()
            .then(setPayload)
            .catch(setError)
            .finally(() => setLoading(false));
    };

    useEffect(() => { charger(); }, []);

    if (error) return <ErrorState onRetry={charger} />;

    const kpiData    = payload?.main?.data;
    const chartData  = payload?.tresorerie?.data;
    const activites  = payload?.activites?.data;

    return (
        <section className="finDash-root" aria-label="Tableau de bord financier">

            {/* ── Ligne 1 : Argent Virtuel + Bilan ── */}
            <div className="finDash-row1">
                <ArgentVirtuelCard loading={loading} data={kpiData} />
                <BilanCard         loading={loading} data={kpiData} />
            </div>

            {/* ── Ligne 2 : KPI Cards ── */}
            <KpiCards loading={loading} data={kpiData} />

            {/* ── Ligne 3 : Graphique + Activités ── */}
            <div className="finDash-row3">
                <GraphiqueTresorerie loading={loading} data={chartData} />
                <ActiviteRecente     loading={loading} activites={activites} />
            </div>

            {/* ── Ligne 4 : Alertes ── */}
            <AlertesFinancieres loading={loading} alertes={kpiData?.alertes} />

        </section>
    );
}

export default Dashboard;
