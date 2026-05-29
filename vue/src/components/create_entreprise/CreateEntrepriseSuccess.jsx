import { CheckCircle2, ArrowRight } from 'lucide-react';
import '../../assets/styles/components/create_entreprise/CreateEntrepriseSuccess.css';

const CreateEntrepriseSuccess = ({ onGoToDashboard }) => {
    return (
        <div className="ceSuccess-root">
            <div className="ceSuccess-backdrop" aria-hidden="true">
                <div className="ceSuccess-blob ceSuccess-blob--1" />
                <div className="ceSuccess-blob ceSuccess-blob--2" />
            </div>

            <div className="ceSuccess-center">
                <div className="ceSuccess-iconWrap" aria-hidden="true">
                    <div className="ceSuccess-iconGlow" />
                    <CheckCircle2 size={56} strokeWidth={1.5} className="ceSuccess-icon" />
                </div>

                <div className="ceSuccess-text">
                    <h1 className="ceSuccess-title">Entreprise créée avec succès</h1>
                    <p className="ceSuccess-subtitle">
                        Votre espace de gestion est prêt. Bienvenue dans AGORA.
                    </p>
                </div>

                <button
                    type="button"
                    className="ceSuccess-cta"
                    onClick={onGoToDashboard}
                    autoFocus
                >
                    Accéder au dashboard
                    <ArrowRight size={18} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
};

export default CreateEntrepriseSuccess;
