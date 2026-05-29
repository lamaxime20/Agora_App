import { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, Hash } from 'lucide-react';
import { hexToHsv, hsvToHex, isValidHexColor } from '../../services/createEntreprise';
import '../../assets/styles/components/create_entreprise/StepCouleurs.css';

// ─── ColorPicker interne ───────────────────────────────────────────────────────

const ColorPickerPopup = ({ hsv, onChange, onClose }) => {
    const squareRef  = useRef(null);
    const hueRef     = useRef(null);
    const draggingSq = useRef(false);
    const draggingHu = useRef(false);

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    const getSqPos = useCallback((e) => {
        const rect = squareRef.current.getBoundingClientRect();
        const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        const y = clamp((e.clientY - rect.top)  / rect.height, 0, 1);
        return { s: Math.round(x * 100), v: Math.round((1 - y) * 100) };
    }, []);

    const getHuePos = useCallback((e) => {
        const rect = hueRef.current.getBoundingClientRect();
        const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        return Math.round(x * 360);
    }, []);

    const onSqPointerDown = (e) => {
        draggingSq.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onChange({ ...hsv, ...getSqPos(e) });
    };
    const onSqPointerMove = (e) => {
        if (!draggingSq.current) return;
        onChange({ ...hsv, ...getSqPos(e) });
    };
    const onSqPointerUp = () => { draggingSq.current = false; };

    const onHuePointerDown = (e) => {
        draggingHu.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onChange({ ...hsv, h: getHuePos(e) });
    };
    const onHuePointerMove = (e) => {
        if (!draggingHu.current) return;
        onChange({ ...hsv, h: getHuePos(e) });
    };
    const onHuePointerUp = () => { draggingHu.current = false; };

    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest('.colorPickerPopup-root')) onClose();
        };
        const t = setTimeout(() => document.addEventListener('pointerdown', handler), 50);
        return () => { clearTimeout(t); document.removeEventListener('pointerdown', handler); };
    }, [onClose]);

    const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
    const pureHueHex = hsvToHex(hsv.h, 100, 100);

    return (
        <div className="colorPickerPopup-root" role="dialog" aria-label="Sélecteur de couleur">
            {/* Carré saturation / valeur */}
            <div
                ref={squareRef}
                className="colorPickerPopup-square"
                style={{ '--picker-hue': pureHueHex }}
                onPointerDown={onSqPointerDown}
                onPointerMove={onSqPointerMove}
                onPointerUp={onSqPointerUp}
                aria-hidden="true"
            >
                <div className="colorPickerPopup-square__saturation" />
                <div className="colorPickerPopup-square__value" />
                <div
                    className="colorPickerPopup-square__cursor"
                    style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
                />
            </div>

            {/* Barre de teinte */}
            <div
                ref={hueRef}
                className="colorPickerPopup-hue"
                onPointerDown={onHuePointerDown}
                onPointerMove={onHuePointerMove}
                onPointerUp={onHuePointerUp}
                aria-hidden="true"
            >
                <div
                    className="colorPickerPopup-hue__thumb"
                    style={{ left: `${(hsv.h / 360) * 100}%` }}
                />
            </div>

            {/* Aperçu + HEX */}
            <div className="colorPickerPopup-footer">
                <div
                    className="colorPickerPopup-preview"
                    style={{ background: currentHex }}
                    aria-hidden="true"
                />
                <span className="colorPickerPopup-hexDisplay">{currentHex.toUpperCase()}</span>
            </div>
        </div>
    );
};

// ─── Champ couleur individuel ──────────────────────────────────────────────────

const ColorField = ({ label, value, fieldKey, onChange, error }) => {
    const [open, setOpen] = useState(false);
    const [hexInput, setHexInput] = useState(value || '');
    const [hsv, setHsv] = useState(() => value && isValidHexColor(value) ? hexToHsv(value) : { h: 0, s: 100, v: 100 });
    const fieldRef = useRef(null);

    useEffect(() => {
        setHexInput(value || '');
        if (value && isValidHexColor(value)) {
            setHsv(hexToHsv(value));
        }
    }, [value]);

    const handleHsvChange = (newHsv) => {
        setHsv(newHsv);
        const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
        setHexInput(hex.toUpperCase());
        onChange(fieldKey, hex);
    };

    const handleHexInput = (e) => {
        const raw = e.target.value;
        setHexInput(raw);
        const normalized = raw.startsWith('#') ? raw : '#' + raw;
        if (isValidHexColor(normalized)) {
            setHsv(hexToHsv(normalized));
            onChange(fieldKey, normalized);
        } else if (raw === '' || raw === '#') {
            onChange(fieldKey, '');
        }
    };

    const handleHexBlur = () => {
        if (!hexInput || hexInput === '#') {
            setHexInput('');
            onChange(fieldKey, '');
        } else {
            const normalized = hexInput.startsWith('#') ? hexInput : '#' + hexInput;
            if (isValidHexColor(normalized)) {
                setHexInput(normalized.toUpperCase());
            } else {
                setHexInput(value || '');
            }
        }
    };

    const previewColor = value && isValidHexColor(value) ? value : null;

    return (
        <div className="colorField-root" ref={fieldRef}>
            <span className="colorField-label">{label}</span>

            <div className={`colorField-control${error ? ' colorField-control--error' : ''}`}>
                <button
                    type="button"
                    className="colorField-preview"
                    style={previewColor ? { background: previewColor } : {}}
                    onClick={() => setOpen(prev => !prev)}
                    aria-label={`Ouvrir le sélecteur pour ${label}`}
                    aria-expanded={open}
                >
                    {!previewColor && <Palette size={14} strokeWidth={1.8} className="colorField-preview__icon" />}
                </button>

                <div className="colorField-hexWrap">
                    <Hash size={13} strokeWidth={2} className="colorField-hashIcon" />
                    <input
                        type="text"
                        className="colorField-hexInput"
                        value={hexInput.replace(/^#/, '')}
                        onChange={handleHexInput}
                        onBlur={handleHexBlur}
                        placeholder="F39C12"
                        maxLength={7}
                        aria-label={`Valeur HEX pour ${label}`}
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="characters"
                    />
                </div>
            </div>

            {error && <span className="colorField-error" role="alert">{error}</span>}

            {open && (
                <ColorPickerPopup
                    hsv={hsv}
                    onChange={handleHsvChange}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
};

// ─── StepCouleurs ──────────────────────────────────────────────────────────────

const COLOR_FIELDS = [
    { key: 'couleur1', label: 'Couleur principale' },
    { key: 'couleur2', label: 'Couleur secondaire' },
    { key: 'couleur3', label: 'Couleur tertiaire' },
];

const StepCouleurs = ({ formData, onChange, onNext, onPrev, errors }) => {
    return (
        <div className="stepCouleurs-root">
            <div className="stepCouleurs-content">
                <p className="stepCouleurs-label">Étape 3 sur 6</p>
                <h2 className="stepCouleurs-title">Les couleurs de votre marque</h2>
                <p className="stepCouleurs-desc">
                    Définissez l'identité visuelle de votre entreprise. Ces champs sont optionnels.
                </p>

                <div className="stepCouleurs-fields">
                    {COLOR_FIELDS.map(({ key, label }) => (
                        <ColorField
                            key={key}
                            fieldKey={key}
                            label={label}
                            value={formData[key]}
                            onChange={onChange}
                            error={errors[key]}
                        />
                    ))}
                </div>
            </div>

            <div className="stepCouleurs-actions">
                <div className="stepCouleurs-actions__row">
                    <button type="button" className="stepCouleurs-btnSecondary" onClick={onPrev}>
                        Précédent
                    </button>
                    <button type="button" className="stepCouleurs-btnPrimary" onClick={onNext}>
                        Continuer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepCouleurs;
