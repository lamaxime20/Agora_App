import { useCallback, useEffect, useState } from 'react';

import AdminDrawer          from '../../components/admin/AdminDrawer';
import AdminConfirmPassword from '../../components/admin/AdminConfirmPassword';
import AjouterAdmin         from '../../components/admin/admin/ajouterAdmin';

import { useAdmin } from '../../context/AdminContext';
import {
    getAdminsMock,
    resetAdminPasswordMock,
    disableAdminMock,
} from '../../services/admin/api';

import '../../assets/styles/pages/admin/admins.css';

function AdminGestion() {
    const { admin: currentAdmin }         = useAdmin();
    const [admins, setAdmins]             = useState([]);
    const [isLoading, setIsLoading]       = useState(true);
    const [error, setError]               = useState('');
    const [successMsg, setSuccessMsg]     = useState('');

    const [showAddDrawer, setShowAddDrawer]             = useState(false);
    const [showDisableConfirm, setShowDisableConfirm]   = useState(false);
    const [targetAdmin, setTargetAdmin]                 = useState(null);
    const [actionLoading, setActionLoading]             = useState(false);
    const [actionError, setActionError]                 = useState('');

    const loadAdmins = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await getAdminsMock();
            setAdmins(res?.data ?? []);
        } catch {
            setError('Impossible de charger les administrateurs.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadAdmins(); }, [loadAdmins]);

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    if (!currentAdmin?.originel) {
        return (
            <div className="adminsGestion-denied">
                <div className="adminsGestion-denied__icon" aria-hidden="true">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                </div>
                <p className="adminsGestion-denied__text">Accès réservé à l'administrateur principal.</p>
            </div>
        );
    }

    const handleAddDone = () => {
        setShowAddDrawer(false);
        showSuccess('Administrateur ajouté avec succès.');
        loadAdmins();
    };

    const handleResetPassword = async (admin) => {
        setActionLoading(true);
        try {
            await resetAdminPasswordMock(admin.id);
            showSuccess(`Mot de passe réinitialisé pour ${admin.email}.`);
        } catch {
            setError('Erreur lors de la réinitialisation.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisable = (admin) => {
        setTargetAdmin(admin);
        setActionError('');
        setShowDisableConfirm(true);
    };

    const handleDisableConfirm = async (password) => {
        setActionLoading(true);
        setActionError('');
        try {
            const res = await disableAdminMock(targetAdmin.id, password);
            if (!res.success) { setActionError(res.message); return; }
            setShowDisableConfirm(false);
            showSuccess(`Compte de ${targetAdmin.email} désactivé.`);
            loadAdmins();
        } catch {
            setActionError('Une erreur est survenue.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="adminsGestion-root">
            <div className="adminsGestion-topBar">
                <div className="adminsGestion-topBar__info">
                    <h2 className="adminsGestion-topBar__title">Administrateurs</h2>
                    {!isLoading && (
                        <span className="adminsGestion-topBar__count">{admins.length} compte{admins.length !== 1 ? 's' : ''}</span>
                    )}
                </div>
                <button
                    type="button"
                    className="adminsGestion-topBar__addBtn"
                    onClick={() => setShowAddDrawer(true)}
                >
                    + Ajouter un admin
                </button>
            </div>

            {successMsg && (
                <div className="adminsGestion-toast" role="status">{successMsg}</div>
            )}

            {isLoading && (
                <div className="adminsGestion-skeleton" aria-label="Chargement">
                    {[1, 2].map(i => <div key={i} className="adminsGestion-skeleton__row" />)}
                </div>
            )}

            {error && !isLoading && (
                <div className="adminsGestion-error" role="alert">
                    <p>{error}</p>
                    <button type="button" className="adminsGestion-error__retry" onClick={loadAdmins}>Réessayer</button>
                </div>
            )}

            {!isLoading && !error && (
                <ul className="adminsGestion-list" role="list">
                    {admins.map(a => (
                        <li key={a.id} className="adminsGestion-card">
                            <div className="adminsGestion-card__avatar" aria-hidden="true">
                                {a.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="adminsGestion-card__info">
                                <span className="adminsGestion-card__email">{a.email}</span>
                                <div className="adminsGestion-card__badges">
                                    {a.originel && (
                                        <span className="adminsGestion-card__badge adminsGestion-card__badge--originel">Principal</span>
                                    )}
                                    <span className={`adminsGestion-card__badge adminsGestion-card__badge--status${a.actif ? ' adminsGestion-card__badge--actif' : ' adminsGestion-card__badge--inactif'}`}>
                                        {a.actif ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>
                            </div>
                            {!a.originel && (
                                <div className="adminsGestion-card__actions">
                                    <button
                                        type="button"
                                        className="adminsGestion-card__resetBtn"
                                        onClick={() => handleResetPassword(a)}
                                        disabled={actionLoading}
                                        aria-label={`Réinitialiser le mot de passe de ${a.email}`}
                                    >
                                        Réinitialiser
                                    </button>
                                    {a.actif && (
                                        <button
                                            type="button"
                                            className="adminsGestion-card__disableBtn"
                                            onClick={() => handleDisable(a)}
                                            aria-label={`Désactiver le compte de ${a.email}`}
                                        >
                                            Désactiver
                                        </button>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {showAddDrawer && (
                <AdminDrawer title="Ajouter un administrateur" onClose={() => setShowAddDrawer(false)}>
                    <AjouterAdmin onDone={handleAddDone} onCancel={() => setShowAddDrawer(false)} />
                </AdminDrawer>
            )}

            {showDisableConfirm && targetAdmin && (
                <AdminDrawer title={`Désactiver ${targetAdmin.email}`} onClose={() => setShowDisableConfirm(false)}>
                    <p className="adminsGestion-disableText">
                        Vous êtes sur le point de désactiver le compte de <strong>{targetAdmin.email}</strong>.
                        Cet administrateur ne pourra plus se connecter.
                    </p>
                    <AdminConfirmPassword
                        label="Saisissez votre mot de passe admin pour confirmer"
                        onConfirm={handleDisableConfirm}
                        onCancel={() => setShowDisableConfirm(false)}
                        isLoading={actionLoading}
                        error={actionError}
                    />
                </AdminDrawer>
            )}
        </div>
    );
}

export default AdminGestion;
