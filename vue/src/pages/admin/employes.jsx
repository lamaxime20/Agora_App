import { useCallback, useEffect, useState } from 'react';

import AdminDrawer             from '../../components/admin/AdminDrawer';
import AdminConfirmPassword    from '../../components/admin/AdminConfirmPassword';
import AjouterEmployeForm      from '../../components/admin/employes/ajouterEmployeForm';

import {
    getEmployeesMock,
    updateEmployeeRoleMock,
    removeEmployeeMock,
    ROLES_EMPLOYE,
    getRoleLabel,
} from '../../services/admin/api';

import '../../assets/styles/pages/admin/employes.css';

function EmployesAdmin() {
    const [employees, setEmployees]   = useState([]);
    const [isLoading, setIsLoading]   = useState(true);
    const [error, setError]           = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [showAddDrawer, setShowAddDrawer]             = useState(false);
    const [editTarget, setEditTarget]                   = useState(null);
    const [editRole, setEditRole]                       = useState('');
    const [showEditConfirm, setShowEditConfirm]         = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm]     = useState(false);
    const [removeTarget, setRemoveTarget]               = useState(null);
    const [actionLoading, setActionLoading]             = useState(false);
    const [actionError, setActionError]                 = useState('');

    const loadEmployees = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await getEmployeesMock();
            setEmployees(res?.data ?? []);
        } catch {
            setError('Impossible de charger les employés.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadEmployees(); }, [loadEmployees]);

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleAddDone = () => {
        setShowAddDrawer(false);
        showSuccess('Employé ajouté avec succès.');
        loadEmployees();
    };

    const handleEditRole = (employee) => {
        setEditTarget(employee);
        setEditRole(employee.role);
        setActionError('');
        setShowEditConfirm(true);
    };

    const handleEditConfirm = async (password) => {
        setActionLoading(true);
        setActionError('');
        try {
            const res = await updateEmployeeRoleMock(editTarget.id, editRole, password);
            if (!res.success) { setActionError(res.message); return; }
            setShowEditConfirm(false);
            showSuccess('Rôle mis à jour.');
            loadEmployees();
        } catch {
            setActionError('Une erreur est survenue.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = (employee) => {
        setRemoveTarget(employee);
        setActionError('');
        setShowRemoveConfirm(true);
    };

    const handleRemoveConfirm = async (password) => {
        setActionLoading(true);
        setActionError('');
        try {
            const res = await removeEmployeeMock(removeTarget.id, password);
            if (!res.success) { setActionError(res.message); return; }
            setShowRemoveConfirm(false);
            showSuccess('Employé retiré avec succès.');
            loadEmployees();
        } catch {
            setActionError('Une erreur est survenue.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="employesAdmin-root">
            <div className="employesAdmin-topBar">
                <div className="employesAdmin-topBar__info">
                    <h2 className="employesAdmin-topBar__title">Employés</h2>
                    {!isLoading && (
                        <span className="employesAdmin-topBar__count">{employees.length} membre{employees.length !== 1 ? 's' : ''}</span>
                    )}
                </div>
                <button
                    type="button"
                    className="employesAdmin-topBar__addBtn"
                    onClick={() => setShowAddDrawer(true)}
                >
                    + Ajouter un employé
                </button>
            </div>

            {successMsg && (
                <div className="employesAdmin-toast" role="status">{successMsg}</div>
            )}

            {isLoading && (
                <div className="employesAdmin-skeleton" aria-label="Chargement">
                    {[1, 2, 3].map(i => <div key={i} className="employesAdmin-skeleton__row" />)}
                </div>
            )}

            {error && !isLoading && (
                <div className="employesAdmin-error" role="alert">
                    <p>{error}</p>
                    <button type="button" className="employesAdmin-error__retry" onClick={loadEmployees}>Réessayer</button>
                </div>
            )}

            {!isLoading && !error && employees.length === 0 && (
                <div className="employesAdmin-empty">
                    <p className="employesAdmin-empty__text">Aucun employé enregistré pour cette entreprise.</p>
                </div>
            )}

            {!isLoading && !error && employees.length > 0 && (
                <ul className="employesAdmin-list" role="list">
                    {employees.map(emp => (
                        <li key={emp.id} className="employesAdmin-card">
                            <div className="employesAdmin-card__avatar" aria-hidden="true">
                                {emp.prenom.charAt(0)}{emp.nom.charAt(0)}
                            </div>
                            <div className="employesAdmin-card__info">
                                <span className="employesAdmin-card__name">{emp.prenom} {emp.nom}</span>
                                <span className="employesAdmin-card__email">{emp.email}</span>
                                <span className="employesAdmin-card__role">{getRoleLabel(emp.role)}</span>
                            </div>
                            <div className="employesAdmin-card__actions">
                                <button
                                    type="button"
                                    className="employesAdmin-card__editBtn"
                                    onClick={() => handleEditRole(emp)}
                                    aria-label={`Modifier le rôle de ${emp.prenom} ${emp.nom}`}
                                >
                                    Modifier rôle
                                </button>
                                <button
                                    type="button"
                                    className="employesAdmin-card__removeBtn"
                                    onClick={() => handleRemove(emp)}
                                    aria-label={`Retirer ${emp.prenom} ${emp.nom}`}
                                >
                                    Retirer
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {showAddDrawer && (
                <AdminDrawer title="Ajouter un employé" onClose={() => setShowAddDrawer(false)}>
                    <AjouterEmployeForm onDone={handleAddDone} onCancel={() => setShowAddDrawer(false)} />
                </AdminDrawer>
            )}

            {showEditConfirm && editTarget && (
                <AdminDrawer title={`Modifier le rôle — ${editTarget.prenom} ${editTarget.nom}`} onClose={() => setShowEditConfirm(false)}>
                    <div className="employesAdmin-editRole">
                        <div className="employesAdmin-editRole__field">
                            <label className="employesAdmin-editRole__label" htmlFor="newRole">Nouveau rôle</label>
                            <select
                                id="newRole"
                                className="employesAdmin-editRole__select"
                                value={editRole}
                                onChange={e => setEditRole(e.target.value)}
                            >
                                {ROLES_EMPLOYE.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                        <AdminConfirmPassword
                            label="Confirmez votre mot de passe admin pour valider"
                            onConfirm={handleEditConfirm}
                            onCancel={() => setShowEditConfirm(false)}
                            isLoading={actionLoading}
                            error={actionError}
                        />
                    </div>
                </AdminDrawer>
            )}

            {showRemoveConfirm && removeTarget && (
                <AdminDrawer title={`Retirer ${removeTarget.prenom} ${removeTarget.nom}`} onClose={() => setShowRemoveConfirm(false)}>
                    <p className="employesAdmin-removeText">
                        Vous êtes sur le point de retirer <strong>{removeTarget.prenom} {removeTarget.nom}</strong> de l'entreprise.
                        Cette action est irréversible.
                    </p>
                    <AdminConfirmPassword
                        label="Saisissez votre mot de passe admin pour confirmer"
                        onConfirm={handleRemoveConfirm}
                        onCancel={() => setShowRemoveConfirm(false)}
                        isLoading={actionLoading}
                        error={actionError}
                    />
                </AdminDrawer>
            )}
        </div>
    );
}

export default EmployesAdmin;
