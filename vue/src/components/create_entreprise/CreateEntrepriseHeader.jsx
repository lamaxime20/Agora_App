import { ArrowLeft, Check } from 'lucide-react';
import '../../assets/styles/components/create_entreprise/CreateEntrepriseHeader.css';

const TOTAL_STEPS = 6;

const CreateEntrepriseHeader = ({ currentStep, onCancel, autoSaved }) => {
    return (
        <header className="ceHeader-root">
            <div className="ceHeader-topRow">
                <button
                    type="button"
                    className="ceHeader-cancelBtn"
                    onClick={onCancel}
                    aria-label="Annuler et revenir en arrière"
                >
                    <ArrowLeft size={15} strokeWidth={2} />
                    <span>Annuler</span>
                </button>

                <span className="ceHeader-title" aria-hidden="true">
                    Créer une entreprise
                </span>

                <div
                    className={`ceHeader-autosave${autoSaved ? ' ceHeader-autosave--visible' : ''}`}
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <Check size={12} strokeWidth={2.5} />
                    <span>Sauvegardé</span>
                </div>
            </div>

            <div className="ceHeader-progress" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-label={`Étape ${currentStep} sur ${TOTAL_STEPS}`}>
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                    <div
                        key={i}
                        className={`ceHeader-progress__segment${i < currentStep ? ' ceHeader-progress__segment--done' : ''}${i === currentStep - 1 ? ' ceHeader-progress__segment--active' : ''}`}
                    />
                ))}
            </div>
        </header>
    );
};

export default CreateEntrepriseHeader;
