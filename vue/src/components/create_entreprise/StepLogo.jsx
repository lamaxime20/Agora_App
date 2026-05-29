import { useState, useRef } from 'react';
import { Upload, Image, X, RefreshCw } from 'lucide-react';
import '../../assets/styles/components/create_entreprise/StepLogo.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE_MB = 5;

const StepLogo = ({ formData, onChange, onNext, onPrev, onLogoFile }) => {
    const [dragging, setDragging] = useState(false);
    const [sizeError, setSizeError] = useState('');
    const inputRef = useRef(null);

    const processFile = (file) => {
        setSizeError('');

        if (!ACCEPTED_TYPES.includes(file.type)) {
            setSizeError('Format non supporté. Utilisez JPG, PNG, WEBP ou SVG.');
            return;
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setSizeError(`Le fichier dépasse ${MAX_SIZE_MB} Mo.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            onChange('logoPreview', e.target.result);
            onLogoFile?.(file);
        };
        reader.readAsDataURL(file);
    };

    const handleFileInput = (e) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = '';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleRemove = () => {
        onChange('logoPreview', '');
        onLogoFile?.(null);
        setSizeError('');
    };

    const hasLogo = !!formData.logoPreview;

    return (
        <div className="stepLogo-root">
            <div className="stepLogo-content">
                <p className="stepLogo-label">Étape 2 sur 6</p>
                <h2 className="stepLogo-title">Donnez un visage à votre entreprise</h2>
                <p className="stepLogo-desc">
                    Votre logo sera affiché partout dans AGORA. Vous pouvez le modifier plus tard.
                </p>

                {!hasLogo ? (
                    <div
                        className={`stepLogo-dropzone${dragging ? ' stepLogo-dropzone--dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label="Zone de dépôt du logo"
                        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
                    >
                        <div className="stepLogo-dropzone__iconWrap">
                            <Upload size={26} strokeWidth={1.6} className="stepLogo-dropzone__icon" />
                        </div>
                        <p className="stepLogo-dropzone__primary">Glissez votre logo ici</p>
                        <p className="stepLogo-dropzone__secondary">ou cliquez pour choisir une image</p>
                        <span className="stepLogo-dropzone__hint">PNG, JPG, WEBP, SVG — max {MAX_SIZE_MB} Mo</span>
                    </div>
                ) : (
                    <div className="stepLogo-preview">
                        <div className="stepLogo-preview__imgWrap">
                            <img
                                src={formData.logoPreview}
                                alt="Logo de l'entreprise"
                                className="stepLogo-preview__img"
                            />
                        </div>
                        <div className="stepLogo-preview__controls">
                            <button
                                type="button"
                                className="stepLogo-preview__changeBtn"
                                onClick={() => inputRef.current?.click()}
                            >
                                <RefreshCw size={15} strokeWidth={2} />
                                Remplacer
                            </button>
                            <button
                                type="button"
                                className="stepLogo-preview__removeBtn"
                                onClick={handleRemove}
                                aria-label="Retirer le logo"
                            >
                                <X size={15} strokeWidth={2.5} />
                                Retirer
                            </button>
                        </div>
                    </div>
                )}

                {sizeError && (
                    <p className="stepLogo-error" role="alert">{sizeError}</p>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(',')}
                    className="sr-only"
                    onChange={handleFileInput}
                    aria-hidden="true"
                    tabIndex={-1}
                />
            </div>

            <div className="stepLogo-actions">
                <div className="stepLogo-actions__row">
                    <button type="button" className="stepLogo-btnSecondary" onClick={onPrev}>
                        Précédent
                    </button>
                    <button type="button" className="stepLogo-btnPrimary" onClick={onNext}>
                        {hasLogo ? 'Continuer' : 'Continuer'}
                    </button>
                </div>
                {!hasLogo && (
                    <button type="button" className="stepLogo-btnSkip" onClick={onNext}>
                        Passer cette étape
                    </button>
                )}
            </div>
        </div>
    );
};

export default StepLogo;
