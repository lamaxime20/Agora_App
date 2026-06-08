import { CheckCircle, Circle, Loader } from "lucide-react";
import { formatDateTime } from "../../../services/livraison.js";
import "../../../assets/styles/components/modules/livraison/DeliveryTimeline.css";

const STEPS = [
    { key: "dateCreation",   label: "Créée" },
    { key: "dateAssignation", label: "Assignée" },
    { key: "dateLancement",   label: "Lancée" },
    { key: "dateLivraison",   label: "Livrée" },
];

function DeliveryTimeline({ livraison }) {
    const getStepState = (key) => {
        if (key === "dateAssignation") {
            return livraison.dateLancement ? "done" : livraison.dateCreation ? "done" : "pending";
        }
        if (livraison[key]) return "done";
        const idx = STEPS.findIndex(s => s.key === key);
        const prev = STEPS[idx - 1];
        if (prev && livraison[prev.key]) return "active";
        return "pending";
    };

    return (
        <div className="deliveryTimeline-root">
            {STEPS.map(({ key, label }, idx) => {
                const state = getStepState(key);
                const date = key === "dateAssignation"
                    ? (livraison.dateLancement ?? livraison.dateCreation)
                    : livraison[key];
                return (
                    <div key={key} className={`deliveryTimeline-step deliveryTimeline-step--${state}`}>
                        <div className="deliveryTimeline-step__line-wrap">
                            <div className="deliveryTimeline-step__icon">
                                {state === "done"   ? <CheckCircle size={18} aria-hidden="true" /> :
                                 state === "active" ? <Loader      size={18} aria-hidden="true" className="deliveryTimeline-step__spin" /> :
                                                      <Circle      size={18} aria-hidden="true" />}
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={`deliveryTimeline-step__connector${state === "done" ? " deliveryTimeline-step__connector--done" : ""}`} />
                            )}
                        </div>
                        <div className="deliveryTimeline-step__content">
                            <span className="deliveryTimeline-step__label">{label}</span>
                            {date && <span className="deliveryTimeline-step__date">{formatDateTime(date)}</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default DeliveryTimeline;
