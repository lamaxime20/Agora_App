import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Package2, Plus, Check, AlertCircle } from "lucide-react";
import produitsData from "../../../../mockups/gestionStocks/produits.json";
import "../../../../assets/styles/components/modules/gestionStocks/modalCreationReapprovisionnement.css";

const defaultForm = { produit_id: "", quantite: "", montant_total: "", commentaire: "" };

function ModalCreationReapprovisionnement({ onClose }) {
    const [form, setForm]                     = useState(defaultForm);
    const [produitSearch, setProduitSearch]   = useState("");
    const [produits, setProduits]             = useState([]);
    const [produitChoisi, setProduitChoisi]   = useState(null);
    const [showDrop, setShowDrop]             = useState(false);
    const [errors, setErrors]                 = useState({});
    const [submitting, setSubmitting]         = useState(false);
    const [success, setSuccess]               = useState(false);
    const dropRef = useRef(null);
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
        if (!form.produit_id) errs.produit_id = "Sélectionnez un produit.";
        if (!form.quantite || Number(form.quantite) <= 0) errs.quantite = "Quantité invalide.";
        if (!form.montant_total || Number(form.montant_total) <= 0) errs.montant_total = "Montant invalide.";
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
        if (e.target === overlayRef.current) onClose();
    };

    if (success) {
        return (
            <div className="modalReappro-overlay" ref={overlayRef} onClick={handleOverlayClick}>
                <div className="modalReappro-panel" role="dialog" aria-modal="true">
                    <div className="modalReappro-success">
                        <div className="modalReappro-success__icon">
                            <Check size={32} aria-hidden="true" />
                        </div>
                        <h3 className="modalReappro-success__title">Réapprovisionnement créé</h3>
                        <p className="modalReappro-success__text">
                            Votre demande a été enregistrée avec succès.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="modalReappro-overlay"
            ref={overlayRef}
            onClick={handleOverlayClick}
            aria-label="Créer un réapprovisionnement"
        >
            <div className="modalReappro-panel" role="dialog" aria-modal="true" aria-labelledby="modalReappro-title">

                {/* ─── Header ──────────────────────────────── */}
                <div className="modalReappro-header">
                    <div>
                        <h2 className="modalReappro-title" id="modalReappro-title">
                            Faire un réapprovisionnement
                        </h2>
                        <p className="modalReappro-subtitle">Enregistrez une nouvelle entrée de stock</p>
                    </div>
                    <button
                        className="modalReappro-close"
                        onClick={onClose}
                        type="button"
                        aria-label="Fermer"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                {/* ─── Corps ───────────────────────────────── */}
                <form className="modalReappro-form" onSubmit={handleSubmit} noValidate>
                    <div className="modalReappro-body">

                        {/* Produit */}
                        <div className="modalReappro-field" ref={dropRef}>
                            <label className="modalReappro-label" htmlFor="reappro-produit">
                                Produit <span aria-hidden="true">*</span>
                            </label>
                            <div className="modalReappro-autocomplete">
                                <Search size={16} className="modalReappro-autocomplete__icon" aria-hidden="true" />
                                <input
                                    id="reappro-produit"
                                    type="text"
                                    className={`app-input modalReappro-autocomplete__input${errors.produit_id ? " app-input--error" : ""}`}
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
                                    <ul className="modalReappro-dropdown" role="listbox">
                                        {produitsFiltres.length === 0 ? (
                                            <li className="modalReappro-dropdown__empty">
                                                <Package2 size={16} aria-hidden="true" />
                                                Aucun produit trouvé
                                            </li>
                                        ) : produitsFiltres.map(p => (
                                            <li
                                                key={p.id}
                                                className="modalReappro-dropdown__item"
                                                role="option"
                                                aria-selected={produitChoisi?.id === p.id}
                                                onMouseDown={() => choisirProduit(p)}
                                            >
                                                <Package2 size={14} className="modalReappro-dropdown__icon" aria-hidden="true" />
                                                <div className="modalReappro-dropdown__info">
                                                    <span className="modalReappro-dropdown__name">{p.nom}</span>
                                                    <span className="modalReappro-dropdown__meta">
                                                        {p.reference} · Stock : {p.quantite_stock}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {errors.produit_id && (
                                <span className="modalReappro-field__error" role="alert">
                                    <AlertCircle size={12} aria-hidden="true" />
                                    {errors.produit_id}
                                </span>
                            )}
                            {produitChoisi && (
                                <div className="modalReappro-chosen">
                                    <Package2 size={14} aria-hidden="true" />
                                    <span>{produitChoisi.nom}</span>
                                    <span className="modalReappro-chosen__meta">
                                        Stock actuel : {produitChoisi.quantite_stock}
                                    </span>
                                    <button
                                        type="button"
                                        className="modalReappro-chosen__clear"
                                        onClick={() => {
                                            setProduitChoisi(null);
                                            setProduitSearch("");
                                            setForm(prev => ({ ...prev, produit_id: "" }));
                                        }}
                                        aria-label="Retirer le produit sélectionné"
                                    >
                                        <X size={12} aria-hidden="true" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Quantité */}
                        <div className="modalReappro-field">
                            <label className="modalReappro-label" htmlFor="reappro-quantite">
                                Quantité <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="reappro-quantite"
                                name="quantite"
                                type="number"
                                min="1"
                                className={`app-input${errors.quantite ? " app-input--error" : ""}`}
                                placeholder="Ex : 50"
                                value={form.quantite}
                                onChange={handleChange}
                            />
                            {errors.quantite && (
                                <span className="modalReappro-field__error" role="alert">
                                    <AlertCircle size={12} aria-hidden="true" />
                                    {errors.quantite}
                                </span>
                            )}
                        </div>

                        {/* Montant total */}
                        <div className="modalReappro-field">
                            <label className="modalReappro-label" htmlFor="reappro-montant">
                                Montant total (FCFA) <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="reappro-montant"
                                name="montant_total"
                                type="number"
                                min="0"
                                className={`app-input${errors.montant_total ? " app-input--error" : ""}`}
                                placeholder="Ex : 47 500"
                                value={form.montant_total}
                                onChange={handleChange}
                            />
                            {errors.montant_total && (
                                <span className="modalReappro-field__error" role="alert">
                                    <AlertCircle size={12} aria-hidden="true" />
                                    {errors.montant_total}
                                </span>
                            )}
                        </div>

                        {/* Commentaire */}
                        <div className="modalReappro-field">
                            <label className="modalReappro-label" htmlFor="reappro-commentaire">
                                Commentaire <span className="modalReappro-optional">(facultatif)</span>
                            </label>
                            <textarea
                                id="reappro-commentaire"
                                name="commentaire"
                                className="app-input modalReappro-textarea"
                                placeholder="Informations supplémentaires…"
                                value={form.commentaire}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* ─── Pied ────────────────────────────────── */}
                    <div className="modalReappro-footer">
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
                            className="app-button app-button--primary modalReappro-submit"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="modalReappro-spinner" aria-hidden="true" />
                                    Création en cours…
                                </>
                            ) : (
                                <>
                                    <Plus size={16} aria-hidden="true" />
                                    Créer le réapprovisionnement
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalCreationReapprovisionnement;
