import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

import { useNotificationsContext } from '../../context/NotificationsContext';
import NotificationDropdown from './NotificationDropdown';
import '../../assets/styles/components/NotificationBell.css';

function NotificationBell({ btnClassName }) {
    const { unreadCount, recentNotifications, isLoadingRecent, markRead, markAllRead, archiveNotification, deleteNotification, refreshRecent } =
        useNotificationsContext();

    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    const toggle = useCallback(() => {
        setOpen((v) => {
            if (!v) refreshRecent();
            return !v;
        });
    }, [refreshRecent]);

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

    const badgeCount = Math.min(unreadCount, 99);

    return (
        <div className="notif-bell" ref={rootRef}>
            <button
                className={btnClassName}
                aria-label={unreadCount > 0 ? `${unreadCount} notifications non lues` : 'Notifications'}
                aria-expanded={open}
                aria-haspopup="true"
                type="button"
                onClick={toggle}
            >
                <Bell size={20} aria-hidden="true" />
            </button>
            {badgeCount > 0 && (
                <span className="notif-bell__badge" aria-hidden="true">
                    {badgeCount > 99 ? '99+' : badgeCount}
                </span>
            )}

            {open && (
                <NotificationDropdown
                    notifications={recentNotifications}
                    isLoading={isLoadingRecent}
                    onMarkRead={markRead}
                    onMarkAllRead={markAllRead}
                    onArchive={archiveNotification}
                    onDelete={deleteNotification}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
}

export default NotificationBell;
