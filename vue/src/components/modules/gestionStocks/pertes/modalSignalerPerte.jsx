import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Package2, AlertTriangle, Check, AlertCircle } from "lucide-react";
import produitsData from "../../../../mockups/gestionStocks/produits.json";
import "../../../../assets/styles/components/modules/gestionStocks/modalSignalerPerte.css";

const defaultForm = { produit_id: "", quantite: "", motif: "" };

function ModalSignalerPerte({ onClose }) {
    const [form, setForm]                   = useState(defaultForm);
    const [produitSearch, setProduitSearch] = useState("");
    const [produits, setProduits]           = useState([]);
    const [produitChoisi, setProduitChoisi] = useState(null);
    const [showDrop, setShowDrop]           = useState(false);
    const [errors, setErrors]               = useState({});
    const [submitting, setSubmitting]       = useState(false);
    const [success, setSuccess]             = useState(false);
    const dropRef    = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setProduits(produitsData.data.produits.filter(p => p.type === "physique"));
        }, 150);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        function handleClick(e) {
            if (dropRef.current && !dropRef.current.contains(e.target)) {
                setShowDrop(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const produitsFiltres = produits.filter(p =>
        p.nom.toLowerCase().includes(produitSearch.toLowerCase()) ||
        p.reference.toLowerCase().includes(produitSearch.toLowerCase())
    );

    const choisirProduit = useCallback((p) => {
        setProduitChoisi(p);
        setProduitSearch(p.nom);
        setForm(prev => ({ ...prev, produit_id: p.id }));
        setShowDrop(false);
        setErrors(prev => ({ ...prev, produit_id: undefined }));
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }, []);

    const valider = () => {
        const errs = {};
        if (!form.produit_id)                          errs.produit_id = "Sélectionnez un produit.";
        if (!form.quantite || Number(form.quantite) <= 0) errs.quantite = "Quantité invalide.";
        if (!form.motif)                               errs.motif = "Sélectionnez un motif.";
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = valider();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setSuccess(true);
            setTimeout(onClose, 1600);
        }, 1200);
    };

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current && !submitting) onClose();
    };

    if (success) {
        return (
            <div className="modalPerte-overlay">
                <div className="modalPerte-panel" role="dialog" aria-modal="true">
                    <div className="modalPerte-success">
                        <div className="modalPerte-success__icon">
                            <Check size={32} aria-hidden="true" />
                        </div>
                        <h3 className="modalPerte-success__title">Perte signalée</h3>
                        <p className="modalPerte-success__text">
                            La perte a été enregistrée. Vous pouvez l'annuler dans les 24 heures.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="modalPerte-overlay"
            ref={overlayRef}
            onClick={handleOverlayClick}
        >
            <div
                className="modalPerte-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalPerte-title"
            >
                {/* ─── Header ──────────────── */}
                <div className="modalPerte-header">
                    <div className="modalPerte-header__icon">
                        <AlertTriangle size={18} aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="modalPerte-title" id="modalPerte-title">
                            Signaler une perte
                        </h2>
                        <p className="modalPerte-subtitle">Déclarez une perte de stock</p>
                    </div>
                    <button
                        className="modalPerte-close"
                        onClick={onClose}
                        type="button"
                        aria-label="Fermer"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                {/* ─── Corps ───────────────── */}
                <form className="modalPerte-form" onSubmit={handleSubmit} noValidate>
                    <div className="modalPerte-body">

                        {/* Produit */}
                        <div className="modalPerte-field" ref={dropRef}>
                            <label className="modalPerte-label" htmlFor="perte-produit">
                                Produit <span aria-hidden="true">*</span>
                            </label>
                            <div className="modalPerte-autocomplete">
                                <Search size={15} className="modalPerte-autocomplete__icon" aria-hidden="true" />
                                <input
                                    id="perte-produit"
                                    type="text"
                                    className={`app-input modalPerte-autocomplete__input${errors.produit_id ? " app-input--error" : ""}`}
                                    placeholder="Rechercher un produit…"
                                    value={produitSearch}
                                    onChange={e => {
                                        setProduitSearch(e.target.value);
                                        setProduitChoisi(null);
                                        setForm(prev => ({ ...prev, produit_id: "" }));
                                        setShowDrop(true);
                                    }}
                                    onFocus={() => setShowDrop(true)}
                                    autoComplete="off"
                                />
                                {showDrop && produitSearch.length > 0 && (
                                    <ul className="modalPerte-dropdown" role="listbox">
                                        {produitsFiltres.length === 0 ? (
                                            <li className="modalPerte-dropdown__empty">
                                                <Package2 size={15} aria-hidden="true" />
                                                Aucun produit trouvé
                                            </li>
                                        ) : produitsFiltres.map(p => (
                                            <li
                                                key={p.id}
                                                className="modalPerte-dropdown__item"
                                                role="option"
                                                aria-selected={produitChoisi?.id === p.id}
                                                onMouseDown={() => choisirProduit(p)}
                                            >
                                                <Package2 size={13} className="modalPerte-dropdown__icon" aria-hidden="true" />
                                                <div className="modalPerte-dropdown__info">
                                                    <span className="modalPerte-dropdown__name">{p.nom}</span>
                                                    <span className="modalPerte-dropdown__meta">
                                                        Stock : {p.quantite_stock} · {p.reference}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {errors.produit_id && (
                                <span className="modalPerte-field__error" role="alert">
                                    <AlertCircle size={12} aria-hidden="true" />
                                    {errors.produit_id}
                                </span>
                            )}
                        </div>

                        {/* Quantité */}
                        <div className="modalPerte-field">
                            <label className="modalPerte-label" htmlFor="perte-quantite">
                                Quantité perdue <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="perte-quantite"
                                name="quantite"
                                type="number"
                                min="1"
                                className={`app-input${errors.quantite ? " app-input--error" : ""}`}
                                placeholder="Ex : 3"
                                value={form.quantite}
                                onChange={handleChange}
                            />
                            {errors.quantite && (
                                <span className="modalPerte-field__error" role="alert">
                                    <AlertCircle size={12} aria-hidden="true" />
                                    {errors.quantite}
                                </span>
                            )}
                        </div>

                        {/* Motif */}
                        <div className="modalPerte-field">
                            <label className="modalPerte-label" htmlFor="perte-motif">
                                Motif <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="perte-motif"
                                name="motif"
                                type="text"
                                className={`app-input${errors.motif ? " app-input--error" : ""}`}
                                placeholder="Ex : vol, casse, péremption…"
                                value={form.motif}
                                onChange={handleChange}
                                autoComplete="off"
                            />
                            {errors.motif && (
                                <span className="modalPerte-field__error" role="alert">
                                    <AlertCircle size={12} aria-hidden="true" />
                                    {errors.motif}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ─── Pied ────────────────────────────────── */}
                    <div className="modalPerte-footer">
                        <button
                            type="button"
                            className="app-button app-button--ghost"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="app-button modalPerte-btn-submit"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="modalPerte-spinner" aria-hidden="true" />
                                    Enregistrement…
                                </>
                            ) : (
                                <>
                                    <AlertTriangle size={16} aria-hidden="true" />
                                    Confirmer la perte
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalSignalerPerte;
