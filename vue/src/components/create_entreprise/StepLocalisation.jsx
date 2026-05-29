import { useState, useRef, useEffect } from 'react';
import { MapPin, Building, AlignLeft, Search, ChevronRight, X } from 'lucide-react';
import { PAYS } from '../../services/createEntreprise';
import '../../assets/styles/components/create_entreprise/StepLocalisation.css';

// ─── Sélecteur pays ────────────────────────────────────────────────────────────

const PaysSheet = ({ value, onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const searchRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => searchRef.current?.focus(), 100);
        return () => clearTimeout(t);
    }, []);

    const filtered = PAYS.filter(p =>
        p.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="paysSheet-overlay" onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="Choisir un pays">
            <div className="paysSheet-panel">
                <div className="paysSheet-handle" />

                <div className="paysSheet-header">
                    <span className="paysSheet-title">Pays</span>
                    <button type="button" className="paysSheet-closeBtn" onClick={onClose} aria-label="Fermer">
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="paysSheet-search">
                    <Search size={16} strokeWidth={2} className="paysSheet-searchIcon" />
                    <input
                        ref={searchRef}
                        type="text"
                        className="paysSheet-searchInput"
                        placeholder="Rechercher un pays..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>

                <ul className="paysSheet-list" role="listbox">
                    {filtered.length === 0 && (
                        <li className="paysSheet-empty">Aucun résultat</li>
                    )}
                    {filtered.map(p => (
                        <li key={p} role="option" aria-selected={value === p}>
                            <button
                                type="button"
                                className={`paysSheet-item${value === p ? ' paysSheet-item--selected' : ''}`}
                                onClick={() => { onSelect(p); onClose(); }}
                            >
                                <span>{p}</span>
                                {value === p && <ChevronRight size={15} strokeWidth={2.5} className="paysSheet-check" />}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// ─── StepLocalisation ─────────────────────────────────────────────────────────

const StepLocalisation = ({ formData, onChange, onNext, onPrev, errors }) => {
    const [paysSheetOpen, setPaysSheetOpen] = useState(false);

    return (
        <div className="stepLocalisation-root">
            <div className="stepLocalisation-content">
                <p className="stepLocalisation-label">Étape 5 sur 6</p>
                <h2 className="stepLocalisation-title">Ancrez votre entreprise</h2>
                <p className="stepLocalisation-desc">
                    Indiquez l'emplacement de votre activité.
                </p>

                <div className="stepLocalisation-fields">
                    {/* Pays */}
                    <div className={`stepLocalisation-field${errors.pays ? ' stepLocalisation-field--error' : ''}`}>
                        <button
                            type="button"
                            className="stepLocalisation-selectorBtn"
                            onClick={() => setPaysSheetOpen(true)}
                            aria-haspopup="dialog"
                            aria-expanded={paysSheetOpen}
                            aria-invalid={!!errors.pays}
                        >
                            <MapPin size={18} strokeWidth={1.8} className="stepLocalisation-inputIcon" />
                            <span className={`stepLocalisation-selectorValue${!formData.pays ? ' stepLocalisation-selectorValue--placeholder' : ''}`}>
                                {formData.pays || 'Pays'}
                            </span>
                            <Search size={15} strokeWidth={2} className="stepLocalisation-selectorChevron" />
                        </button>
                        <label className={`stepLocalisation-floatLabel${formData.pays ? ' stepLocalisation-floatLabel--raised' : ''}`}>
                            Pays <span className="stepLocalisation-required" aria-hidden="true">*</span>
                        </label>
                        {errors.pays && <span className="stepLocalisation-error" role="alert">{errors.pays}</span>}
                    </div>

                    {/* Ville */}
                    <div className={`stepLocalisation-field${errors.ville ? ' stepLocalisation-field--error' : ''}`}>
                        <div className="stepLocalisation-inputWrap">
                            <Building size={18} strokeWidth={1.8} className="stepLocalisation-inputIcon" />
                            <input
                                type="text"
                                className="stepLocalisation-input"
                                placeholder="Ex : Douala"
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
                                placeholder="Ex : Avenue de la Liberté, Akwa"
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

            {paysSheetOpen && (
                <PaysSheet
                    value={formData.pays}
                    onSelect={val => onChange('pays', val)}
                    onClose={() => setPaysSheetOpen(false)}
                />
            )}
        </div>
    );
};

export default StepLocalisation;
