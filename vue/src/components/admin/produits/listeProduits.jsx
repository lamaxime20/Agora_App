import { useCallback, useEffect, useRef, useState } from 'react';

import AdminDrawer          from '../AdminDrawer';
import AdminConfirmPassword from '../AdminConfirmPassword';

import {
    getProductsMock,
    getCategoriesMock,
    addProductMock,
    deleteProductMock,
} from '../../../services/admin/api';

import '../../../assets/styles/components/admin/produits/listeProduits.css';

const DRAFT_KEY = 'draft_product';

const emptyForm = {
    nom:           '',
    prix_unitaire: '',
    type:          'physique',
    stock_actuel:  '',
    seuil_alerte:  '',
    unite_mesure:  '',
    description:   '',
    categorie:     '',
    image:         null,
};

function loadDraft() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        return raw ? { ...emptyForm, ...JSON.parse(raw) } : { ...emptyForm };
    } catch {
        return { ...emptyForm };
    }
}

function saveDraft(form) {
    const { image, ...rest } = form;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
}

function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
}

function ListeProduitsAdmin() {
    const [products, setProducts]     = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading]   = useState(true);
    const [error, setError]           = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [showAddDrawer, setShowAddDrawer]         = useState(false);
    const [form, setForm]                           = useState(loadDraft);
    const [catFilter, setCatFilter]                 = useState('');
    const [filteredCats, setFilteredCats]           = useState([]);
    const [showCatList, setShowCatList]             = useState(false);
    const [addLoading, setAddLoading]               = useState(false);
    const [addError, setAddError]                   = useState('');
    const [dragOver, setDragOver]                   = useState(false);

    const [deleteTarget, setDeleteTarget]           = useState(null);
    const [deleteLoading, setDeleteLoading]         = useState(false);
    const [deleteError, setDeleteError]             = useState('');

    const fileInputRef = useRef(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [prodRes, catRes] = await Promise.all([getProductsMock(), getCategoriesMock()]);
            setProducts(prodRes?.data ?? []);
            setCategories(catRes?.data ?? []);
        } catch {
            setError('Impossible de charger les données.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const q = catFilter.toLowerCase();
        setFilteredCats(
            q ? categories.filter(c => c.name.toLowerCase().includes(q)) : categories
        );
    }, [catFilter, categories]);

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleFormChange = (field) => (e) => {
        const updated = { ...form, [field]: e.target.value };
        setForm(updated);
        saveDraft(updated);
    };

    const handleTypeChange = (type) => {
        const updated = { ...form, type };
        setForm(updated);
        saveDraft(updated);
    };

    const handleImageDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setForm(prev => ({ ...prev, image: file }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setForm(prev => ({ ...prev, image: file }));
    };

    const handleSelectCategory = (cat) => {
        const updated = { ...form, categorie: cat.name };
        setForm(updated);
        saveDraft(updated);
        setCatFilter(cat.name);
        setShowCatList(false);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setAddError('');

        if (!form.nom.trim()) { setAddError('Le nom est requis.'); return; }
        if (!form.categorie.trim()) { setAddError('La catégorie est requise.'); return; }
        if (form.type === 'physique' && !form.seuil_alerte) { setAddError('Le seuil d\'alerte est requis pour un produit physique.'); return; }
        if (categories.length === 0) { setAddError('Aucune catégorie disponible. Veuillez d\'abord créer une catégorie.'); return; }

        setAddLoading(true);
        try {
            await addProductMock(form);
            clearDraft();
            setForm({ ...emptyForm });
            setCatFilter('');
            setShowAddDrawer(false);
            showSuccess('Produit ajouté avec succès.');
            loadData();
        } catch {
            setAddError('Une erreur est survenue lors de l\'ajout.');
        } finally {
            setAddLoading(false);
        }
    };

    const handleDeleteConfirm = async (password) => {
        setDeleteLoading(true);
        setDeleteError('');
        try {
            const res = await deleteProductMock(deleteTarget.id, password);
            if (!res.success) { setDeleteError(res.message); return; }
            setDeleteTarget(null);
            showSuccess('Produit supprimé avec succès.');
            loadData();
        } catch {
            setDeleteError('Une erreur est survenue.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const isService = form.type === 'service';

    return (
        <div className="listeProduitsAdmin-root">
            <div className="listeProduitsAdmin-topBar">
                <div className="listeProduitsAdmin-topBar__info">
                    <h3 className="listeProduitsAdmin-topBar__title">Liste des produits</h3>
                    {!isLoading && (
                        <span className="listeProduitsAdmin-topBar__count">
                            {products.length} produit{products.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    className="listeProduitsAdmin-topBar__addBtn"
                    onClick={() => {
                        setCatFilter(form.categorie || '');
                        setAddError('');
                        setShowAddDrawer(true);
                    }}
                >
                    + Ajouter un produit
                </button>
            </div>

            {successMsg && <div className="listeProduitsAdmin-toast" role="status">{successMsg}</div>}

            {categories.length === 0 && !isLoading && (
                <div className="listeProduitsAdmin-warning" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Aucune catégorie enregistrée. Créez d'abord une catégorie avant d'ajouter des produits.
                </div>
            )}

            {isLoading && (
                <div className="listeProduitsAdmin-skeleton" aria-label="Chargement">
                    {[1, 2, 3].map(i => <div key={i} className="listeProduitsAdmin-skeleton__row" />)}
                </div>
            )}

            {error && !isLoading && (
                <div className="listeProduitsAdmin-error" role="alert">
                    <p>{error}</p>
                    <button type="button" className="listeProduitsAdmin-error__retry" onClick={loadData}>Réessayer</button>
                </div>
            )}

            {!isLoading && !error && products.length === 0 && (
                <div className="listeProduitsAdmin-empty">
                    <p className="listeProduitsAdmin-empty__text">Aucun produit enregistré pour cette entreprise.</p>
                </div>
            )}

            {!isLoading && !error && products.length > 0 && (
                <ul className="listeProduitsAdmin-list" role="list">
                    {products.map(p => (
                        <li key={p.id} className="listeProduitsAdmin-card">
                            <div className="listeProduitsAdmin-card__imageWrap">
                                {p.image ? (
                                    <img src={p.image} alt={p.name} className="listeProduitsAdmin-card__image" />
                                ) : (
                                    <div className="listeProduitsAdmin-card__imagePlaceholder" aria-hidden="true">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    </div>
                                )}
                            </div>
                            <div className="listeProduitsAdmin-card__info">
                                <span className="listeProduitsAdmin-card__name">{p.name}</span>
                                <span className="listeProduitsAdmin-card__description">{p.description}</span>
                                <div className="listeProduitsAdmin-card__meta">
                                    <span className={`listeProduitsAdmin-card__type listeProduitsAdmin-card__type--${p.type}`}>
                                        {p.type === 'physique' ? 'Physique' : 'Service'}
                                    </span>
                                    <span className="listeProduitsAdmin-card__cat">{p.categorie?.name}</span>
                                </div>
                            </div>
                            <div className="listeProduitsAdmin-card__actions">
                                <span className="listeProduitsAdmin-card__prix">
                                    {Number(p.prix_unitaire).toLocaleString('fr-FR')} FCFA
                                </span>
                                <button
                                    type="button"
                                    className="listeProduitsAdmin-card__deleteBtn"
                                    onClick={() => { setDeleteError(''); setDeleteTarget(p); }}
                                    aria-label={`Supprimer ${p.name}`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {showAddDrawer && (
                <AdminDrawer title="Ajouter un produit" onClose={() => setShowAddDrawer(false)}>
                    <form className="listeProduitsAdmin-form" onSubmit={handleAddSubmit} noValidate>
                        <div
                            className={`listeProduitsAdmin-form__dropzone${dragOver ? ' listeProduitsAdmin-form__dropzone--active' : ''}`}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleImageDrop}
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            aria-label="Choisir ou déposer une image"
                            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                        >
                            {form.image ? (
                                <>
                                    <img
                                        src={URL.createObjectURL(form.image)}
                                        alt="Aperçu"
                                        className="listeProduitsAdmin-form__dropzone__preview"
                                    />
                                    <button
                                        type="button"
                                        className="listeProduitsAdmin-form__dropzone__removeImg"
                                        onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, image: null })); }}
                                        aria-label="Supprimer l'image"
                                    >
                                        ×
                                    </button>
                                </>
                            ) : (
                                <div className="listeProduitsAdmin-form__dropzone__placeholder">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    <span>Glissez une image ou cliquez pour en choisir une</span>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="listeProduitsAdmin-form__fileInput" onChange={handleImageChange} aria-hidden="true" tabIndex={-1} />
                        </div>

                        <div className="listeProduitsAdmin-form__field">
                            <label className="listeProduitsAdmin-form__label" htmlFor="prodNom">Nom *</label>
                            <input id="prodNom" type="text" className="listeProduitsAdmin-form__input" value={form.nom} onChange={handleFormChange('nom')} required />
                        </div>

                        <div className="listeProduitsAdmin-form__field">
                            <label className="listeProduitsAdmin-form__label" htmlFor="prodPrix">Prix unitaire (FCFA) *</label>
                            <input id="prodPrix" type="number" min="0" className="listeProduitsAdmin-form__input" value={form.prix_unitaire} onChange={handleFormChange('prix_unitaire')} required />
                        </div>

                        <div className="listeProduitsAdmin-form__field">
                            <span className="listeProduitsAdmin-form__label">Type de produit *</span>
                            <div className="listeProduitsAdmin-form__radioCards">
                                {['physique', 'service'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        className={`listeProduitsAdmin-form__radioCard${form.type === t ? ' listeProduitsAdmin-form__radioCard--active' : ''}`}
                                        onClick={() => handleTypeChange(t)}
                                        aria-pressed={form.type === t}
                                    >
                                        {t === 'physique' ? 'Physique' : 'Service'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!isService && (
                            <>
                                <div className="listeProduitsAdmin-form__field">
                                    <label className="listeProduitsAdmin-form__label" htmlFor="prodStock">Stock actuel</label>
                                    <input id="prodStock" type="number" min="0" className="listeProduitsAdmin-form__input" value={form.stock_actuel} onChange={handleFormChange('stock_actuel')} />
                                </div>
                                <div className="listeProduitsAdmin-form__field">
                                    <label className="listeProduitsAdmin-form__label" htmlFor="prodSeuil">Seuil d'alerte *</label>
                                    <input id="prodSeuil" type="number" min="0" className="listeProduitsAdmin-form__input" value={form.seuil_alerte} onChange={handleFormChange('seuil_alerte')} required />
                                </div>
                                <div className="listeProduitsAdmin-form__field">
                                    <label className="listeProduitsAdmin-form__label" htmlFor="prodUnite">Unité de mesure</label>
                                    <input id="prodUnite" type="text" className="listeProduitsAdmin-form__input" placeholder="pièce, kg, litre..." value={form.unite_mesure} onChange={handleFormChange('unite_mesure')} />
                                </div>
                            </>
                        )}

                        <div className="listeProduitsAdmin-form__field">
                            <label className="listeProduitsAdmin-form__label" htmlFor="prodDesc">Description</label>
                            <textarea id="prodDesc" className="listeProduitsAdmin-form__textarea" value={form.description} onChange={handleFormChange('description')} rows={3} />
                        </div>

                        <div className="listeProduitsAdmin-form__field" style={{ position: 'relative' }}>
                            <label className="listeProduitsAdmin-form__label" htmlFor="prodCategorie">Catégorie *</label>
                            <input
                                id="prodCategorie"
                                type="text"
                                className="listeProduitsAdmin-form__input"
                                value={catFilter}
                                onChange={e => { setCatFilter(e.target.value); setShowCatList(true); }}
                                onFocus={() => setShowCatList(true)}
                                onBlur={() => setTimeout(() => setShowCatList(false), 150)}
                                placeholder="Rechercher une catégorie..."
                                autoComplete="off"
                            />
                            {showCatList && (
                                <ul className="listeProduitsAdmin-form__catList" role="listbox">
                                    {filteredCats.length === 0 ? (
                                        <li className="listeProduitsAdmin-form__catList__empty">Aucune catégorie enregistrée</li>
                                    ) : filteredCats.map(c => (
                                        <li
                                            key={c.id}
                                            className="listeProduitsAdmin-form__catList__item"
                                            role="option"
                                            aria-selected={form.categorie === c.name}
                                            onMouseDown={() => handleSelectCategory(c)}
                                        >
                                            {c.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {addError && <p className="listeProduitsAdmin-form__error" role="alert">{addError}</p>}

                        <div className="listeProduitsAdmin-form__actions">
                            <button type="button" className="listeProduitsAdmin-form__cancelBtn" onClick={() => setShowAddDrawer(false)}>
                                Annuler
                            </button>
                            <button type="submit" className="listeProduitsAdmin-form__submitBtn" disabled={addLoading}>
                                {addLoading ? <span className="listeProduitsAdmin-form__spinner" aria-hidden="true" /> : 'Ajouter le produit'}
                            </button>
                        </div>
                    </form>
                </AdminDrawer>
            )}

            {deleteTarget && (
                <AdminDrawer title={`Supprimer — ${deleteTarget.name}`} onClose={() => setDeleteTarget(null)}>
                    <p className="listeProduitsAdmin-deleteText">
                        Vous êtes sur le point de supprimer <strong>{deleteTarget.name}</strong>. Cette action est irréversible.
                    </p>
                    <AdminConfirmPassword
                        label="Saisissez votre mot de passe admin pour confirmer la suppression"
                        onConfirm={handleDeleteConfirm}
                        onCancel={() => setDeleteTarget(null)}
                        isLoading={deleteLoading}
                        error={deleteError}
                    />
                </AdminDrawer>
            )}
        </div>
    );
}

export default ListeProduitsAdmin;
