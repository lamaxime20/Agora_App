import { useCallback, useEffect, useState } from 'react';

import AdminDrawer          from '../AdminDrawer';
import AdminConfirmPassword from '../AdminConfirmPassword';

import {
    getCategoriesMock,
    addCategorieMock,
    deleteCategorieMock,
} from '../../../services/admin/api';

import '../../../assets/styles/components/admin/produits/listeCategories.css';

function ListeCategoriesAdmin() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading]   = useState(true);
    const [error, setError]           = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [showAddForm, setShowAddForm]             = useState(false);
    const [addForm, setAddForm]                     = useState({ nom: '', description: '' });
    const [addLoading, setAddLoading]               = useState(false);
    const [addError, setAddError]                   = useState('');

    const [deleteTarget, setDeleteTarget]           = useState(null);
    const [deleteLoading, setDeleteLoading]         = useState(false);
    const [deleteError, setDeleteError]             = useState('');

    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await getCategoriesMock();
            setCategories(res?.data ?? []);
        } catch {
            setError('Impossible de charger les catégories.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!addForm.nom.trim()) { setAddError('Le nom est requis.'); return; }
        setAddLoading(true);
        setAddError('');
        try {
            await addCategorieMock({ name: addForm.nom, description: addForm.description });
            setAddForm({ nom: '', description: '' });
            setShowAddForm(false);
            showSuccess('Catégorie ajoutée avec succès.');
            loadCategories();
        } catch {
            setAddError('Une erreur est survenue.');
        } finally {
            setAddLoading(false);
        }
    };

    const handleDeleteConfirm = async (password) => {
        setDeleteLoading(true);
        setDeleteError('');
        try {
            const res = await deleteCategorieMock(deleteTarget.id, password);
            if (!res.success) { setDeleteError(res.message); return; }
            setDeleteTarget(null);
            showSuccess('Catégorie supprimée avec succès.');
            loadCategories();
        } catch {
            setDeleteError('Une erreur est survenue.');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="listeCatsAdmin-root">
            <div className="listeCatsAdmin-topBar">
                <div className="listeCatsAdmin-topBar__info">
                    <h3 className="listeCatsAdmin-topBar__title">Catégories</h3>
                    {!isLoading && (
                        <span className="listeCatsAdmin-topBar__count">
                            {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    className="listeCatsAdmin-topBar__addBtn"
                    onClick={() => { setAddError(''); setShowAddForm(true); }}
                >
                    + Ajouter une catégorie
                </button>
            </div>

            {successMsg && <div className="listeCatsAdmin-toast" role="status">{successMsg}</div>}

            {isLoading && (
                <div className="listeCatsAdmin-skeleton" aria-label="Chargement">
                    {[1, 2, 3].map(i => <div key={i} className="listeCatsAdmin-skeleton__row" />)}
                </div>
            )}

            {error && !isLoading && (
                <div className="listeCatsAdmin-error" role="alert">
                    <p>{error}</p>
                    <button type="button" className="listeCatsAdmin-error__retry" onClick={loadCategories}>Réessayer</button>
                </div>
            )}

            {!isLoading && !error && categories.length === 0 && (
                <div className="listeCatsAdmin-empty">
                    <p className="listeCatsAdmin-empty__text">Aucune catégorie enregistrée. Commencez par en créer une.</p>
                </div>
            )}

            {!isLoading && !error && categories.length > 0 && (
                <ul className="listeCatsAdmin-list" role="list">
                    {categories.map(cat => (
                        <li key={cat.id} className="listeCatsAdmin-card">
                            <div className="listeCatsAdmin-card__info">
                                <span className="listeCatsAdmin-card__name">{cat.name}</span>
                                <span className="listeCatsAdmin-card__description">{cat.description}</span>
                                <span className="listeCatsAdmin-card__count">
                                    {cat.nb_produits} produit{cat.nb_produits !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="listeCatsAdmin-card__deleteBtn"
                                onClick={() => { setDeleteError(''); setDeleteTarget(cat); }}
                                aria-label={`Supprimer la catégorie ${cat.name}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {showAddForm && (
                <AdminDrawer title="Ajouter une catégorie" onClose={() => setShowAddForm(false)}>
                    <form className="listeCatsAdmin-addForm" onSubmit={handleAddSubmit} noValidate>
                        <div className="listeCatsAdmin-addForm__field">
                            <label className="listeCatsAdmin-addForm__label" htmlFor="catNom">Nom *</label>
                            <input
                                id="catNom"
                                type="text"
                                className="listeCatsAdmin-addForm__input"
                                value={addForm.nom}
                                onChange={e => setAddForm(f => ({ ...f, nom: e.target.value }))}
                                required
                                disabled={addLoading}
                                autoFocus
                            />
                        </div>
                        <div className="listeCatsAdmin-addForm__field">
                            <label className="listeCatsAdmin-addForm__label" htmlFor="catDesc">Description</label>
                            <textarea
                                id="catDesc"
                                className="listeCatsAdmin-addForm__textarea"
                                value={addForm.description}
                                onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                                rows={3}
                                disabled={addLoading}
                            />
                        </div>
                        {addError && <p className="listeCatsAdmin-addForm__error" role="alert">{addError}</p>}
                        <div className="listeCatsAdmin-addForm__actions">
                            <button type="button" className="listeCatsAdmin-addForm__cancelBtn" onClick={() => setShowAddForm(false)}>Annuler</button>
                            <button type="submit" className="listeCatsAdmin-addForm__submitBtn" disabled={addLoading || !addForm.nom}>
                                {addLoading ? <span className="listeCatsAdmin-addForm__spinner" aria-hidden="true" /> : 'Ajouter'}
                            </button>
                        </div>
                    </form>
                </AdminDrawer>
            )}

            {deleteTarget && (
                <AdminDrawer title={`Supprimer — ${deleteTarget.name}`} onClose={() => setDeleteTarget(null)}>
                    <p className="listeCatsAdmin-deleteText">
                        Vous êtes sur le point de supprimer la catégorie <strong>{deleteTarget.name}</strong>.
                        {deleteTarget.nb_produits > 0 && (
                            <> Cette catégorie contient <strong>{deleteTarget.nb_produits} produit{deleteTarget.nb_produits > 1 ? 's' : ''}</strong>. La suppression peut affecter ces produits.</>
                        )}
                    </p>
                    <AdminConfirmPassword
                        label="Saisissez votre mot de passe admin pour confirmer"
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

export default ListeCategoriesAdmin;
