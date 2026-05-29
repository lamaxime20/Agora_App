import { Shield, AlignLeft, LoaderCircle } from 'lucide-react';
import '../../assets/styles/components/create_entreprise/StepPolitique.css';

const MAX_DESC = 600;

const StepPolitique = ({ formData, onChange, onNext, onPrev, errors, submitting }) => {
    const descLength = String(formData.description || '').length;

    return (
        <div className="stepPolitique-root">
            <div className="stepPolitique-content">
                <p className="stepPolitique-label">Étape 6 sur 6</p>
                <h2 className="stepPolitique-title">Finalisez l'identité</h2>
                <p className="stepPolitique-desc">
                    Ces informations aideront votre équipe et vos clients à comprendre votre mission.
                </p>

                <div className="stepPolitique-fields">
                    {/* Description */}
                    <div className={`stepPolitique-fieldGroup${errors.description ? ' stepPolitique-fieldGroup--error' : ''}`}>
                        <div className="stepPolitique-fieldHeader">
                            <div className="stepPolitique-fieldHeader__left">
                                <AlignLeft size={16} strokeWidth={1.8} className="stepPolitique-fieldIcon" />
                                <span className="stepPolitique-fieldTitle">
                                    Description
                                    <span className="stepPolitique-required" aria-hidden="true"> *</span>
                                </span>
                            </div>
                            <span className={`stepPolitique-counter${descLength > MAX_DESC * 0.9 ? ' stepPolitique-counter--warn' : ''}`}>
                                {descLength} / {MAX_DESC}
                            </span>
                        </div>
                        <textarea
                            className="stepPolitique-textarea"
                            placeholder="Décrivez votre entreprise, vos activités et vos objectifs..."
                            value={formData.description}
                            onChange={e => onChange('description', e.target.value)}
                            rows={5}
                            maxLength={MAX_DESC}
                            aria-label="Description de l'entreprise"
                            aria-invalid={!!errors.description}
                        />
                        {errors.description && (
                            <span className="stepPolitique-error" role="alert">{errors.description}</span>
                        )}
                    </div>

                    {/* Politique */}
                    <div className={`stepPolitique-fieldGroup stepPolitique-fieldGroup--policy${errors.politique ? ' stepPolitique-fieldGroup--error' : ''}`}>
                        <div className="stepPolitique-fieldHeader">
                            <div className="stepPolitique-fieldHeader__left">
                                <Shield size={16} strokeWidth={1.8} className="stepPolitique-fieldIcon" />
                                <span className="stepPolitique-fieldTitle">
                                    Politique d'entreprise
                                    <span className="stepPolitique-required" aria-hidden="true"> *</span>
                                </span>
                            </div>
                        </div>
                        <textarea
                            className="stepPolitique-textarea stepPolitique-textarea--policy"
                            placeholder="Ex : Nous nous engageons à fournir des services de qualité, à respecter nos engagements et à protéger les données de nos clients..."
                            value={formData.politique}
                            onChange={e => onChange('politique', e.target.value)}
                            rows={5}
                            aria-label="Politique de l'entreprise"
                            aria-invalid={!!errors.politique}
                        />
                        {errors.politique && (
                            <span className="stepPolitique-error" role="alert">{errors.politique}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="stepPolitique-actions">
                <div className="stepPolitique-actions__row">
                    <button
                        type="button"
                        className="stepPolitique-btnSecondary"
                        onClick={onPrev}
                        disabled={submitting}
                    >
                        Précédent
                    </button>
                    <button
                        type="button"
                        className="stepPolitique-btnCreate"
                        onClick={onNext}
                        disabled={submitting}
                        aria-busy={submitting}
                    >
                        {submitting ? (
                            <>
                                <LoaderCircle size={18} strokeWidth={2} className="stepPolitique-spinner" />
                                Création…
                            </>
                        ) : (
                            'Créer l\'entreprise'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepPolitique;
