import { useState, useMemo } from 'react';
import { MapPin, Building, AlignLeft } from 'lucide-react';
import { PAYS } from '../../services/createEntreprise';
import '../../assets/styles/components/create_entreprise/StepLocalisation.css';

// ─── Autocomplete pays ─────────────────────────────────────────────────────────

const PaysAutocomplete = ({ value, onChange, error }) => {
    const [open, setOpen] = useState(false);

    // 5 pays aléatoires stables pour toute la session
    const initialSuggestions = useMemo(
        () => [...PAYS].sort(() => Math.random() - 0.5).slice(0, 5),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const suggestions = value.trim()
        ? PAYS.filter(p => p.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
        : initialSuggestions;

    const handleSelect = (pays) => {
        onChange('pays', pays);
        setOpen(false);
    };

    return (
        <div className={`stepLocalisation-field${error ? ' stepLocalisation-field--error' : ''}`}>
            <div className="stepLocalisation-inputWrap">
                <MapPin size={18} strokeWidth={1.8} className="stepLocalisation-inputIcon" />
                <input
                    type="text"
                    className="stepLocalisation-input"
                    value={value}
                    onChange={e => { onChange('pays', e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    onKeyDown={e => e.key === 'Escape' && setOpen(false)}
                    aria-label="Pays"
                    aria-invalid={!!error}
                    aria-autocomplete="list"
                    aria-expanded={open}
                    autoComplete="off"
                    maxLength={80}
                />
            </div>

            <label className={`stepLocalisation-floatLabel${value ? ' stepLocalisation-floatLabel--raised' : ''}`}>
                Pays <span className="stepLocalisation-required" aria-hidden="true">*</span>
            </label>

            {error && <span className="stepLocalisation-error" role="alert">{error}</span>}

            {open && suggestions.length > 0 && (
                <ul className="stepLocalisation-autocomplete" role="listbox" aria-label="Suggestions de pays">
                    {suggestions.map(p => (
                        <li key={p} role="option" aria-selected={value === p}>
                            <button
                                type="button"
                                className={`stepLocalisation-autocomplete__item${value === p ? ' stepLocalisation-autocomplete__item--active' : ''}`}
                                onMouseDown={e => { e.preventDefault(); handleSelect(p); }}
                            >
                                {p}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ─── StepLocalisation ─────────────────────────────────────────────────────────

const StepLocalisation = ({ formData, onChange, onNext, onPrev, errors }) => {
    return (
        <div className="stepLocalisation-root">
            <div className="stepLocalisation-content">
                <p className="stepLocalisation-label">Étape 5 sur 6</p>
                <h2 className="stepLocalisation-title">Ancrez votre entreprise</h2>
                <p className="stepLocalisation-desc">
                    Indiquez l'emplacement de votre activité.
                </p>

                <div className="stepLocalisation-fields">
                    {/* Pays — autocomplete libre */}
                    <PaysAutocomplete
                        value={formData.pays}
                        onChange={onChange}
                        error={errors.pays}
                    />

                    {/* Ville */}
                    <div className={`stepLocalisation-field${errors.ville ? ' stepLocalisation-field--error' : ''}`}>
                        <div className="stepLocalisation-inputWrap">
                            <Building size={18} strokeWidth={1.8} className="stepLocalisation-inputIcon" />
                            <input
                                type="text"
                                className="stepLocalisation-input"
                                value={formData.ville}
                                onChange={e => onChange('ville', e.target.value)}
                                aria-label="Ville"
                                aria-invalid={!!errors.ville}
                                autoComplete="address-level2"
                            />
                        </div>
                        <label className={`stepLocalisation-floatLabel${formData.ville ? ' stepLocalisation-floatLabel--raised' : ''}`}>
                            Ville <span className="stepLocalisation-required" aria-hidden="true">*</span>
                        </label>
                        {errors.ville && <span className="stepLocalisation-error" role="alert">{errors.ville}</span>}
                    </div>

                    {/* Adresse */}
                    <div className={`stepLocalisation-field${errors.adresse ? ' stepLocalisation-field--error' : ''}`}>
                        <div className="stepLocalisation-inputWrap stepLocalisation-inputWrap--textarea">
                            <AlignLeft size={18} strokeWidth={1.8} className="stepLocalisation-inputIcon stepLocalisation-inputIcon--top" />
                            <textarea
                                className="stepLocalisation-textarea"
                                value={formData.adresse}
                                onChange={e => onChange('adresse', e.target.value)}
                                rows={3}
                                aria-label="Adresse"
                                aria-invalid={!!errors.adresse}
                                autoComplete="street-address"
                            />
                        </div>
                        <label className={`stepLocalisation-floatLabel stepLocalisation-floatLabel--textarea${formData.adresse ? ' stepLocalisation-floatLabel--raised' : ''}`}>
                            Adresse <span className="stepLocalisation-required" aria-hidden="true">*</span>
                        </label>
                        {errors.adresse && <span className="stepLocalisation-error" role="alert">{errors.adresse}</span>}
                    </div>
                </div>
            </div>

            <div className="stepLocalisation-actions">
                <div className="stepLocalisation-actions__row">
                    <button type="button" className="stepLocalisation-btnSecondary" onClick={onPrev}>
                        Précédent
                    </button>
                    <button type="button" className="stepLocalisation-btnPrimary" onClick={onNext}>
                        Continuer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepLocalisation;
