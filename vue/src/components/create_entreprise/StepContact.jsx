import { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Globe, Check, ChevronDown, X } from 'lucide-react';
import { PREFIXES_TELEPHONE } from '../../services/createEntreprise';
import '../../assets/styles/components/create_entreprise/StepContact.css';

// ─── Sélecteur préfixe téléphone ──────────────────────────────────────────────

const PrefixSelector = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (!wrapRef.current?.contains(e.target)) setOpen(false);
        };
        const t = setTimeout(() => document.addEventListener('pointerdown', handler), 50);
        return () => { clearTimeout(t); document.removeEventListener('pointerdown', handler); };
    }, [open]);

    const current = PREFIXES_TELEPHONE.find(p => p.code === value) || PREFIXES_TELEPHONE[0];

    return (
        <div className="prefixSelector-root" ref={wrapRef}>
            <button
                type="button"
                className="prefixSelector-btn"
                onClick={() => setOpen(prev => !prev)}
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={`Indicatif téléphonique : ${current.pays} ${current.code}`}
            >
                <span className="prefixSelector-code">{current.code}</span>
                <ChevronDown size={13} strokeWidth={2.5} className={`prefixSelector-chevron${open ? ' prefixSelector-chevron--open' : ''}`} />
            </button>

            {open && (
                <ul className="prefixSelector-dropdown" role="listbox" aria-label="Indicatifs téléphoniques">
                    {PREFIXES_TELEPHONE.map(p => (
                        <li key={p.code} role="option" aria-selected={p.code === value}>
                            <button
                                type="button"
                                className={`prefixSelector-item${p.code === value ? ' prefixSelector-item--active' : ''}`}
                                onClick={() => { onChange(p.code); setOpen(false); }}
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
    const [emailTouched, setEmailTouched] = useState(false);
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
                                placeholder="contact@entreprise.com"
                                value={formData.email}
                                onChange={e => onChange('email', e.target.value)}
                                onBlur={() => setEmailTouched(true)}
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
                                placeholder="677 000 000"
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
                                placeholder="https://votre-site.com"
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
