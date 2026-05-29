import { useState, useMemo } from 'react';
import { Building2, Briefcase } from 'lucide-react';
import { SECTEURS } from '../../services/createEntreprise';
import '../../assets/styles/components/create_entreprise/StepIdentite.css';

// ─── Autocomplete secteur ──────────────────────────────────────────────────────

const SecteurAutocomplete = ({ value, onChange, error }) => {
    const [open, setOpen] = useState(false);

    // 5 secteurs aléatoires stables pour toute la session (suggestions initiales)
    const initialSuggestions = useMemo(
        () => [...SECTEURS].sort(() => Math.random() - 0.5).slice(0, 5),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const suggestions = value.trim()
        ? SECTEURS.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
        : initialSuggestions;

    const handleSelect = (secteur) => {
        onChange('secteur', secteur);
        setOpen(false);
    };

    return (
        <div
            className={`stepIdentite-field${error ? ' stepIdentite-field--error' : ''}`}
        >
            <div className="stepIdentite-inputWrap">
                <Briefcase size={18} strokeWidth={1.8} className="stepIdentite-inputIcon" />
                <input
                    type="text"
                    className="stepIdentite-input"
                    value={value}
                    onChange={e => { onChange('secteur', e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    onKeyDown={e => e.key === 'Escape' && setOpen(false)}
                    aria-label="Secteur d'activité"
                    aria-invalid={!!error}
                    aria-autocomplete="list"
                    aria-expanded={open}
                    autoComplete="off"
                    maxLength={120}
                />
            </div>

            <label className={`stepIdentite-floatLabel${value ? ' stepIdentite-floatLabel--raised' : ''}`}>
                Secteur d'activité <span className="stepIdentite-required" aria-hidden="true">*</span>
            </label>

            {error && <span className="stepIdentite-error" role="alert">{error}</span>}

            {open && suggestions.length > 0 && (
                <ul className="stepIdentite-autocomplete" role="listbox" aria-label="Suggestions de secteur">
                    {suggestions.map(s => (
                        <li key={s} role="option" aria-selected={value === s}>
                            <button
                                type="button"
                                className={`stepIdentite-autocomplete__item${value === s ? ' stepIdentite-autocomplete__item--active' : ''}`}
                                onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
                            >
                                {s}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ─── StepIdentite ─────────────────────────────────────────────────────────────

const StepIdentite = ({ formData, onChange, onNext, errors }) => {
    return (
        <div className="stepIdentite-root">
            <div className="stepIdentite-content">
                <p className="stepIdentite-label">Étape 1 sur 6</p>
                <h2 className="stepIdentite-title">Commençons par votre entreprise</h2>
                <p className="stepIdentite-desc">
                    Donnez un nom et un secteur à votre activité.
                </p>

                <div className="stepIdentite-fieldGroup">
                    {/* Nom de l'entreprise */}
                    <div className={`stepIdentite-field${errors.nom ? ' stepIdentite-field--error' : ''}`}>
                        <div className="stepIdentite-inputWrap">
                            <Building2 size={18} strokeWidth={1.8} className="stepIdentite-inputIcon" />
                            <input
                                type="text"
                                className="stepIdentite-input"
                                value={formData.nom}
                                onChange={e => onChange('nom', e.target.value)}
                                aria-label="Nom de l'entreprise"
                                aria-invalid={!!errors.nom}
                                autoComplete="organization"
                                maxLength={120}
                            />
                        </div>
                        <label className={`stepIdentite-floatLabel${formData.nom ? ' stepIdentite-floatLabel--raised' : ''}`}>
                            Nom de l'entreprise <span className="stepIdentite-required" aria-hidden="true">*</span>
                        </label>
                        {errors.nom && (
                            <span className="stepIdentite-error" role="alert">{errors.nom}</span>
                        )}
                    </div>

                    {/* Secteur — autocomplete libre */}
                    <SecteurAutocomplete
                        value={formData.secteur}
                        onChange={onChange}
                        error={errors.secteur}
                    />
                </div>
            </div>

            <div className="stepIdentite-actions">
                <button type="button" className="stepIdentite-btnPrimary" onClick={onNext}>
                    Continuer
                </button>
            </div>
        </div>
    );
};

export default StepIdentite;
