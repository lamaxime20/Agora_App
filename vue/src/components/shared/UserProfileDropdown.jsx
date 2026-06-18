import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User } from 'lucide-react';

import { useAuthorization } from '../../hooks/useAuthorization';
import '../../assets/styles/components/UserProfileDropdown.css';

function UserProfileDropdown({ btnClassName }) {
    const { user } = useAuthorization();
    const navigate  = useNavigate();
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    const toggle = useCallback(() => setOpen((v) => !v), []);

    useEffect(() => {
        if (!open) return;

        function onPointerDown(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        }

        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);

    const handleSettings = () => {
        setOpen(false);
        navigate('/application/parametres-utilisateur');
    };

    return (
        <div className="user-profile-dropdown" ref={rootRef}>
            <button
                className={btnClassName}
                aria-label="Profil utilisateur"
                aria-expanded={open}
                aria-haspopup="true"
                type="button"
                onClick={toggle}
            >
                <User size={20} aria-hidden="true" />
            </button>

            {open && (
                <div className="user-profile-dropdown__bubble" role="dialog" aria-label="Profil">
                    <div className="user-profile-dropdown__avatar" aria-hidden="true">
                        <User size={22} />
                    </div>

                    <p className="user-profile-dropdown__name">
                        {user?.prenom} {user?.nom}
                    </p>

                    <p className="user-profile-dropdown__email">{user?.email}</p>

                    {user?.role && (
                        <span className="user-profile-dropdown__role">{user.role}</span>
                    )}

                    <div className="user-profile-dropdown__divider" />

                    <button
                        className="user-profile-dropdown__settings-btn"
                        type="button"
                        onClick={handleSettings}
                    >
                        <Settings size={15} aria-hidden="true" />
                        Paramètres
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserProfileDropdown;
