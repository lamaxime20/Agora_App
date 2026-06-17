import { useEffect } from 'react';

import '../../assets/styles/components/admin/AdminDrawer.css';

function AdminDrawer({ title, children, onClose }) {
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div className="adminDrawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
            <div
                className="adminDrawer-panel"
                onClick={e => e.stopPropagation()}
            >
                <div className="adminDrawer-panel__header">
                    <h2 className="adminDrawer-panel__title">{title}</h2>
                    <button
                        type="button"
                        className="adminDrawer-panel__closeBtn"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div className="adminDrawer-panel__body">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default AdminDrawer;
