import { useState, useRef, useEffect } from 'react';
import { Building2, Briefcase, ChevronDown, Search, X, ChevronRight } from 'lucide-react';
import { SECTEURS } from '../../services/createEntreprise';
import '../../assets/styles/components/create_entreprise/StepIdentite.css';

const SecteurSheet = ({ value, onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const searchRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => searchRef.current?.focus(), 100);
        return () => clearTimeout(t);
    }, []);

    const filtered = SECTEURS.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
    );

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="secteurSheet-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Choisir un secteur">
            <div className="secteurSheet-panel">
                <div className="secteurSheet-handle" />

                <div className="secteurSheet-header">
                    <span className="secteurSheet-title">Secteur d'activité</span>
                    <button type="button" className="secteurSheet-closeBtn" onClick={onClose} aria-label="Fermer">
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="secteurSheet-search">
                    <Search size={16} strokeWidth={2} className="secteurSheet-searchIcon" />
                    <input
                        ref={searchRef}
                        type="text"
                        className="secteurSheet-searchInput"
                        placeholder="Rechercher un secteur..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        aria-label="Rechercher un secteur"
                    />
                </div>

                <ul className="secteurSheet-list" role="listbox" aria-label="Secteurs d'activité">
                    {filtered.length === 0 && (
                        <li className="secteurSheet-empty">Aucun résultat</li>
                    )}
                    {filtered.map(s => (
                        <li key={s} role="option" aria-selected={value === s}>
                            <button
                                type="button"
                                className={`secteurSheet-item${value === s ? ' secteurSheet-item--selected' : ''}`}
                                onClick={() => { onSelect(s); onClose(); }}
                            >
                                <span>{s}</span>
                                {value === s && <ChevronRight size={15} strokeWidth={2.5} className="secteurSheet-check" />}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const StepIdentite = ({ formData, onChange, onNext, errors }) => {
    const [sheetOpen, setSheetOpen] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext();
    };

    return (
        <div className="stepIdentite-root">
            <div className="stepIdentite-content">
                <p className="stepIdentite-label">Étape 1 sur 6</p>
                <h2 className="stepIdentite-title">Commençons par votre entreprise</h2>
                <p className="stepIdentite-desc">
                    Donnez un nom et un secteur à votre activité.
                </p>

                <form className="stepIdentite-form" onSubmit={handleSubmit} noValidate>
                    <div className="stepIdentite-fieldGroup">
                        {/* Nom de l'entreprise */}
                        <div className={`stepIdentite-field${errors.nom ? ' stepIdentite-field--error' : ''}`}>
                            <div className="stepIdentite-inputWrap">
                                <Building2 size={18} strokeWidth={1.8} className="stepIdentite-inputIcon" />
                                <input
                                    type="text"
                                    className="stepIdentite-input"
                                    placeholder="Ex : Boulangerie Moderne"
                                    value={formData.nom}
                                    onChange={e => onChange('nom', e.target.value)}
                                    aria-label="Nom de l'entreprise"
                                    aria-invalid={!!errors.nom}
                                    aria-describedby={errors.nom ? 'nom-error' : undefined}
                                    autoComplete="organization"
                                    maxLength={120}
                                />
                            </div>
                            <label className={`stepIdentite-floatLabel${formData.nom ? ' stepIdentite-floatLabel--raised' : ''}`}>
                                Nom de l'entreprise <span className="stepIdentite-required" aria-hidden="true">*</span>
                            </label>
                            {errors.nom && (
                                <span id="nom-error" className="stepIdentite-error" role="alert">{errors.nom}</span>
                            )}
                        </div>

                        {/* Secteur */}
                        <div className={`stepIdentite-field${errors.secteur ? ' stepIdentite-field--error' : ''}`}>
                            <button
                                type="button"
                                className="stepIdentite-sectorBtn"
                                onClick={() => setSheetOpen(true)}
                                aria-haspopup="dialog"
                                aria-expanded={sheetOpen}
                                aria-invalid={!!errors.secteur}
                            >
                                <Briefcase size={18} strokeWidth={1.8} className="stepIdentite-inputIcon" />
                                <span className={`stepIdentite-sectorValue${!formData.secteur ? ' stepIdentite-sectorValue--placeholder' : ''}`}>
                                    {formData.secteur || "Secteur d'activité"}
                                </span>
                                <ChevronDown size={16} strokeWidth={2} className="stepIdentite-sectorChevron" />
                            </button>
                            <label className={`stepIdentite-floatLabel stepIdentite-floatLabel--sector${formData.secteur ? ' stepIdentite-floatLabel--raised' : ''}`}>
                                Secteur d'activité <span className="stepIdentite-required" aria-hidden="true">*</span>
                            </label>
                            {errors.secteur && (
                                <span className="stepIdentite-error" role="alert">{errors.secteur}</span>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            <div className="stepIdentite-actions">
                <button
                    type="button"
                    className="stepIdentite-btnPrimary"
                    onClick={onNext}
                >
                    Continuer
                </button>
            </div>

            {sheetOpen && (
                <SecteurSheet
                    value={formData.secteur}
                    onSelect={val => onChange('secteur', val)}
                    onClose={() => setSheetOpen(false)}
                />
            )}
        </div>
    );
};

export default StepIdentite;
