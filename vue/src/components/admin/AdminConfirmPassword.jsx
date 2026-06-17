import { useState } from 'react';

import '../../assets/styles/components/admin/AdminConfirmPassword.css';

function AdminConfirmPassword({ label, onConfirm, onCancel, isLoading, error }) {
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!password) return;
        onConfirm(password);
    };

    return (
        <form className="adminConfirmPwd-root" onSubmit={handleSubmit} noValidate>
            <div className="adminConfirmPwd-field">
                <label className="adminConfirmPwd-field__label" htmlFor="confirmPwd">
                    {label ?? 'Mot de passe administrateur'}
                </label>
                <input
                    id="confirmPwd"
                    type="password"
                    className="adminConfirmPwd-field__input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoFocus
                />
            </div>

            {error && <p className="adminConfirmPwd-error" role="alert">{error}</p>}

            <div className="adminConfirmPwd-actions">
                <button
                    type="button"
                    className="adminConfirmPwd-actions__cancel"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="adminConfirmPwd-actions__confirm"
                    disabled={isLoading || !password}
                >
                    {isLoading ? (
                        <span className="adminConfirmPwd-actions__spinner" aria-hidden="true" />
                    ) : 'Confirmer'}
                </button>
            </div>
        </form>
    );
}

export default AdminConfirmPassword;
