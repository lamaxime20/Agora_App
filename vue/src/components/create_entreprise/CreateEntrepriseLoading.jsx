import { useEffect, useState } from 'react';
import agoraLogo from '../../assets/images/logo_sans_background.svg';
import '../../assets/styles/components/create_entreprise/CreateEntrepriseLoading.css';

const MESSAGES = [
    'Création de votre espace ...',
    'Configuration des accès ...',
    'Préparation du dashboard ...',
];

const CreateEntrepriseLoading = () => {
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % MESSAGES.length);
        }, 900);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="ceLoading-root" role="status" aria-live="polite" aria-label="Création de l'entreprise en cours">
            <div className="ceLoading-backdrop" aria-hidden="true">
                <div className="ceLoading-blob ceLoading-blob--1" />
                <div className="ceLoading-blob ceLoading-blob--2" />
            </div>

            <div className="ceLoading-center">
                <div className="ceLoading-ring" aria-hidden="true">
                    <div className="ceLoading-ring__track" />
                    <div className="ceLoading-ring__fill" />
                    <div className="ceLoading-ring__logo">
                        <img src={agoraLogo} alt="" className="ceLoading-ring__logoImg" />
                    </div>
                </div>

                <p className="ceLoading-message" key={msgIndex}>
                    {MESSAGES[msgIndex]}
                </p>

                <div className="ceLoading-dots" aria-hidden="true">
                    <span className="ceLoading-dot" />
                    <span className="ceLoading-dot" />
                    <span className="ceLoading-dot" />
                </div>
            </div>
        </div>
    );
};

export default CreateEntrepriseLoading;
