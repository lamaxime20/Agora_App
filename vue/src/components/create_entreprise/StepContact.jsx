import { useState } from 'react';
import { Mail, Phone, Globe, Check } from 'lucide-react';
import { PREFIXES_TELEPHONE } from '../../services/createEntreprise';
import '../../assets/styles/components/create_entreprise/StepContact.css';

// ─── Autocomplete préfixe téléphonique ────────────────────────────────────────

const PrefixSelector = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);

    // 5 préfixes aléatoires stables pour toute la session
    const [initialSuggestions] = useState(
        () => [...PREFIXES_TELEPHONE].sort(() => Math.random() - 0.5).slice(0, 5)
    );

    const trimmed = String(value || '').trim();
    const suggestions = trimmed
        ? PREFIXES_TELEPHONE.filter(p =>
            p.code.includes(trimmed) ||
            p.pays.toLowerCase().includes(trimmed.toLowerCase())
          ).slice(0, 8)
        : initialSuggestions;

    const handleSelect = (p) => {
        onChange(p.code);
        setOpen(false);
    };

    return (
        <div className="prefixSelector-root">
            <input
                type="text"
                className="prefixSelector-input"
                value={value}
                onChange={e => { onChange(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onKeyDown={e => e.key === 'Escape' && setOpen(false)}
                aria-label="Indicatif téléphonique"
                aria-autocomplete="list"
                aria-expanded={open}
                autoComplete="off"
                inputMode="tel"
                maxLength={8}
                placeholder="+237"
            />

            {open && suggestions.length > 0 && (
                <ul className="prefixSelector-dropdown" role="listbox" aria-label="Indicatifs téléphoniques">
                    {suggestions.map(p => (
                        <li key={p.code} role="option" aria-selected={value === p.code}>
                            <button
                                type="button"
                                className={`prefixSelector-item${value === p.code ? ' prefixSelector-item--active' : ''}`}
                                onMouseDown={e => { e.preventDefault(); handleSelect(p); }}
                            >
                                <span className="prefixSelector-item__pays">{p.pays}</span>
                                <span className="prefixSelector-item__code">{p.code}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ─── Validation email en direct ────────────────────────────────────────────────

function isEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

// ─── StepContact ──────────────────────────────────────────────────────────────

const StepContact = ({ formData, onChange, onNext, onPrev, errors }) => {
    const emailValid = formData.email && isEmailValid(formData.email);

    return (
        <div className="stepContact-root">
            <div className="stepContact-content">
                <p className="stepContact-label">Étape 4 sur 6</p>
                <h2 className="stepContact-title">Comment vous joindre</h2>
                <p className="stepContact-desc">
                    Ces informations permettront à vos clients et partenaires de vous contacter.
                </p>

                <div className="stepContact-fields">
                    {/* Email */}
                    <div className={`stepContact-field${errors.email ? ' stepContact-field--error' : ''}`}>
                        <div className="stepContact-inputWrap">
                            <Mail size={18} strokeWidth={1.8} className="stepContact-inputIcon" />
                            <input
                                type="email"
                                className="stepContact-input"
                                value={formData.email}
                                onChange={e => onChange('email', e.target.value)}
                                aria-label="Adresse email de l'entreprise"
                                aria-invalid={!!errors.email}
                                autoComplete="email"
                            />
                            {emailValid && !errors.email && (
                                <Check size={16} strokeWidth={2.5} className="stepContact-validIcon" />
                            )}
                        </div>
                        <label className={`stepContact-floatLabel${formData.email ? ' stepContact-floatLabel--raised' : ''}`}>
                            Adresse email <span className="stepContact-required" aria-hidden="true">*</span>
                        </label>
                        {errors.email && <span className="stepContact-error" role="alert">{errors.email}</span>}
                    </div>

                    {/* Téléphone */}
                    <div className={`stepContact-field${errors.telephoneNumber ? ' stepContact-field--error' : ''}`}>
                        <div className="stepContact-inputWrap stepContact-inputWrap--phone">
                            <Phone size={18} strokeWidth={1.8} className="stepContact-inputIcon" />
                            <PrefixSelector
                                value={formData.telephonePrefix}
                                onChange={val => onChange('telephonePrefix', val)}
                            />
                            <div className="stepContact-phoneDivider" aria-hidden="true" />
                            <input
                                type="tel"
                                className="stepContact-input stepContact-input--phone"
                                value={formData.telephoneNumber}
                                onChange={e => onChange('telephoneNumber', e.target.value)}
                                aria-label="Numéro de téléphone"
                                aria-invalid={!!errors.telephoneNumber}
                                autoComplete="tel"
                                inputMode="tel"
                            />
                        </div>
                        <label className={`stepContact-floatLabel stepContact-floatLabel--phone${formData.telephoneNumber ? ' stepContact-floatLabel--raised' : ''}`}>
                            Numéro de téléphone <span className="stepContact-required" aria-hidden="true">*</span>
                        </label>
                        {errors.telephoneNumber && <span className="stepContact-error" role="alert">{errors.telephoneNumber}</span>}
                    </div>

                    {/* Site web */}
                    <div className={`stepContact-field${errors.siteWeb ? ' stepContact-field--error' : ''}`}>
                        <div className="stepContact-inputWrap">
                            <Globe size={18} strokeWidth={1.8} className="stepContact-inputIcon" />
                            <input
                                type="url"
                                className="stepContact-input"
                                value={formData.siteWeb}
                                onChange={e => onChange('siteWeb', e.target.value)}
                                aria-label="Site web de l'entreprise (optionnel)"
                                autoComplete="url"
                            />
                        </div>
                        <label className={`stepContact-floatLabel${formData.siteWeb ? ' stepContact-floatLabel--raised' : ''}`}>
                            Site web <span className="stepContact-optional">(optionnel)</span>
                        </label>
                        {errors.siteWeb && <span className="stepContact-error" role="alert">{errors.siteWeb}</span>}
                    </div>
                </div>
            </div>

            <div className="stepContact-actions">
                <div className="stepContact-actions__row">
                    <button type="button" className="stepContact-btnSecondary" onClick={onPrev}>
                        Précédent
                    </button>
                    <button type="button" className="stepContact-btnPrimary" onClick={onNext}>
                        Continuer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepContact;
