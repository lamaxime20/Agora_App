import { useState, useEffect, useRef, useCallback } from "react";
import { X, Upload, Check } from "lucide-react";
import categoriesData from "../../../../mockups/gestionStocks/categories.json";
import "../../../../assets/styles/components/modules/gestionStocks/modalAjoutProduit.css";

const DRAFT_KEY = "agora_draft_produit";

const defaultForm = {
    nom: "",
    prix_unitaire: "",
    type: "physique",
    stock_actuel: "",
    seuil_alerte: "",
    unite: "",
    description: "",
    categorie_id: "",
};

function ModalAjoutProduit({ onClose, produitInitial = null }) {
    const isModification = produitInitial !== null;

    const buildInitialForm = () => {
        if (isModification) {
            return {
                nom:          produitInitial.nom ?? "",
                prix_unitaire:produitInitial.prix_unitaire ?? "",
                type:         produitInitial.type ?? "physique",
                stock_actuel: produitInitial.quantite_stock ?? "",
                seuil_alerte: produitInitial.seuil_alerte ?? "",
                unite:        produitInitial.unite ?? "",
                description:  produitInitial.description ?? "",
                categorie_id: produitInitial.categorie?.id ?? "",
            };
        }
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) return JSON.parse(saved);
        } catch { /* draft corrompu, ignorer */ }
        return defaultForm;
    };

    const [form, setForm]                       = useState(buildInitialForm);
    const [imagePreview, setImagePreview]       = useState(produitInitial?.image_url ?? null);
    const [isDragging, setIsDragging]           = useState(false);
    const [categories, setCategories]           = useState([]);
    const [catSearch, setCatSearch]             = useState(produitInitial?.categorie?.nom ?? "");
    const [showCatDropdown, setShowCatDropdown] = useState(false);
    const fileInputRef = useRef(null);
    const saveTimer    = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setCategories(categoriesData.data.categories);
        }, 200);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (isModification) return;
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* quota */ }
        }, 500);
        return () => clearTimeout(saveTimer.current);
    }, [form, isModification]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleImage = useCallback((file) => {
        if (!file?.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = e => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        handleImage(e.dataTransfer.files[0]);
    }, [handleImage]);

    const catsFiltrees = categories.filter(c =>
        c.nom.toLowerCase().includes(catSearch.toLowerCase())
    );

    const handleCatSelect = (cat) => {
        setCatSearch(cat.nom);
        setForm(prev => ({ ...prev, categorie_id: cat.id }));
        setShowCatDropdown(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isModification) {
            try { localStorage.removeItem(DRAFT_KEY); } catch { /* rien */ }
        }
        onClose();
    };

    const estPhysique = form.type === "physique";

    return (
        <div
            className="modalProduit-overlay"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            role="presentation"
        >
            <div
                className="modalProduit-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalProduit-title"
            >
                <div className="modalProduit-header">
                    <h2 id="modalProduit-title" className="modalProduit-title">
                        {isModification ? "Modifier le produit" : "Ajouter un produit"}
                    </h2>
                    <button
                        className="modalProduit-close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <form className="modalProduit-form" onSubmit={handleSubmit} noValidate>
                    <div className="modalProduit-body">

                        {/* Nom */}
                        <div className="modalProduit-field">
                            <label className="modalProduit-label" htmlFor="mp-nom">
                                Nom du produit <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="mp-nom"
                                name="nom"
                                type="text"
                                className="app-input"
                                placeholder="Ex : Cahier grand format"
                                value={form.nom}
                                onChange={handleChange}
                                required
                                autoComplete="off"
                            />
                        </div>

                        {/* Image drag & drop */}
                        <div className="modalProduit-field">
                            <label className="modalProduit-label">Image du produit</label>
                            <div
                                className={`modalProduit-dropzone${isDragging ? " modalProduit-dropzone--dragging" : ""}${imagePreview ? " modalProduit-dropzone--has-image" : ""}`}
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                aria-label="Zone de dépôt — cliquez ou glissez une image"
                                onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Aperçu du produit"
                                        className="modalProduit-dropzone__preview"
                                    />
                                ) : (
                                    <div className="modalProduit-dropzone__placeholder">
                                        <Upload size={24} aria-hidden="true" />
                                        <span>Glissez une image ou cliquez pour choisir</span>
                                        <span className="modalProduit-dropzone__hint">PNG, JPG, WebP — max 5 Mo</span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                aria-label="Choisir une image"
                                onChange={e => handleImage(e.target.files[0])}
                            />
                        </div>

                        {/* Prix */}
                        <div className="modalProduit-field">
                            <label className="modalProduit-label" htmlFor="mp-prix">
                                Prix unitaire (FCFA) <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="mp-prix"
                                name="prix_unitaire"
                                type="number"
                                min="0"
                                className="app-input"
                                placeholder="Ex : 500"
                                value={form.prix_unitaire}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Type */}
                        <fieldset className="modalProduit-fieldset">
                            <legend className="modalProduit-label">Type de produit</legend>
                            <div className="modalProduit-radios">
                                {["physique", "service"].map(t => (
                                    <label
                                        key={t}
                                        className={`modalProduit-radio${form.type === t ? " modalProduit-radio--active" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={t}
                                            checked={form.type === t}
                                            onChange={() => setForm(prev => ({ ...prev, type: t }))}
                                            disabled={isModification}
                                            className="sr-only"
                                        />
                                        {form.type === t && <Check size={14} aria-hidden="true" />}
                                        {t === "physique" ? "Physique" : "Service"}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {/* Champs physique — animation slide
                            En création : stock actuel + seuil d'alerte + unité
                            En modification : seuil d'alerte + unité seulement
                              (le stock ne se modifie que via ravitaillement/pertes) */}
                        <div
                            className={`modalProduit-physical-container${estPhysique ? " modalProduit-physical-container--visible" : ""}`}
                            aria-hidden={!estPhysique}
                        >
                            <div className="modalProduit-grid">
                                {!isModification && (
                                    <div className="modalProduit-field">
                                        <label className="modalProduit-label" htmlFor="mp-stock">
                                            Stock actuel <span aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="mp-stock"
                                            name="stock_actuel"
                                            type="number"
                                            min="0"
                                            className="app-input"
                                            placeholder="Ex : 100"
                                            value={form.stock_actuel}
                                            onChange={handleChange}
                                            required={estPhysique}
                                            tabIndex={estPhysique ? 0 : -1}
                                        />
                                    </div>
                                )}
                                <div className="modalProduit-field">
                                    <label className="modalProduit-label" htmlFor="mp-seuil">
                                        Seuil d'alerte de stock <span aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="mp-seuil"
                                        name="seuil_alerte"
                                        type="number"
                                        min="0"
                                        className="app-input"
                                        placeholder="Ex : 20"
                                        value={form.seuil_alerte}
                                        onChange={handleChange}
                                        required={estPhysique}
                                        tabIndex={estPhysique ? 0 : -1}
                                    />
                                </div>
                                <div className="modalProduit-field">
                                    <label className="modalProduit-label" htmlFor="mp-unite">
                                        Unité de mesure <span aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="mp-unite"
                                        name="unite"
                                        type="text"
                                        className="app-input"
                                        placeholder="Ex : pièce, kg, litre…"
                                        value={form.unite}
                                        onChange={handleChange}
                                        required={estPhysique}
                                        tabIndex={estPhysique ? 0 : -1}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="modalProduit-field">
                            <label className="modalProduit-label" htmlFor="mp-desc">Description</label>
                            <textarea
                                id="mp-desc"
                                name="description"
                                className="app-input modalProduit-textarea"
                                placeholder="Description courte du produit…"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        {/* Catégorie avec autocomplete */}
                        <div className="modalProduit-field modalProduit-field--relative">
                            <label className="modalProduit-label" htmlFor="mp-categorie">Catégorie</label>
                            <div className="modalProduit-cat-wrap">
                                <input
                                    id="mp-categorie"
                                    type="text"
                                    className="app-input"
                                    placeholder="Rechercher ou taper une catégorie…"
                                    value={catSearch}
                                    onChange={e => { setCatSearch(e.target.value); setShowCatDropdown(true); }}
                                    onFocus={() => setShowCatDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowCatDropdown(false), 150)}
                                    autoComplete="off"
                                    aria-haspopup="listbox"
                                    aria-expanded={showCatDropdown}
                                />
                                {showCatDropdown && (
                                    <ul
                                        className="modalProduit-cat-dropdown"
                                        role="listbox"
                                        aria-label="Catégories disponibles"
                                    >
                                        {catsFiltrees.length === 0 ? (
                                            <li className="modalProduit-cat-dropdown__empty">
                                                Pas de catégorie enregistrée
                                            </li>
                                        ) : (
                                            catsFiltrees.map(cat => (
                                                <li
                                                    key={cat.id}
                                                    className="modalProduit-cat-dropdown__item"
                                                    role="option"
                                                    aria-selected={form.categorie_id === cat.id}
                                                    onMouseDown={() => handleCatSelect(cat)}
                                                >
                                                    {cat.nom}
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="modalProduit-footer">
                        <button type="button" className="app-button app-button--ghost" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="app-button app-button--primary">
                            {isModification ? "Enregistrer les modifications" : "Ajouter le produit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalAjoutProduit;
