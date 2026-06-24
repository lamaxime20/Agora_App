import { Archive, Bell, CheckCheck, Loader2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import '../../assets/styles/components/NotificationDropdown.css';

const PRIORITY_DOT = {
    critical: 'notif-drop__dot--critical',
    high:     'notif-drop__dot--high',
    medium:   'notif-drop__dot--medium',
    low:      'notif-drop__dot--low',
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const sec  = Math.floor(diff / 1000);
    if (sec < 60)   return "À l'instant";
    const min = Math.floor(sec / 60);
    if (min < 60)   return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)     return `il y a ${h} h`;
    const d = Math.floor(h / 24);
    return `il y a ${d} j`;
}

function NotificationItem({ notification, onMarkRead, onArchive, onDelete }) {
    const { id, title, message, priority, is_read, created_at } = notification;

    return (
        <li className={`notif-drop__item${is_read ? '' : ' notif-drop__item--unread'}`}>
            <button
                className="notif-drop__item-body"
                type="button"
                onClick={() => !is_read && onMarkRead(id)}
                aria-label={is_read ? title : `Marquer comme lu : ${title}`}
            >
                <span className={`notif-drop__dot ${PRIORITY_DOT[priority] ?? PRIORITY_DOT.medium}`} aria-hidden="true" />
                <span className="notif-drop__text">
                    <span className="notif-drop__title">{title}</span>
                    {message && <span className="notif-drop__message">{message}</span>}
                    <span className="notif-drop__time">{timeAgo(created_at)}</span>
                </span>
            </button>
            <div className="notif-drop__item-actions">
                <button
                    type="button"
                    className="notif-drop__action-btn"
                    aria-label="Archiver"
                    onClick={() => onArchive(id)}
                >
                    <Archive size={13} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="notif-drop__action-btn notif-drop__action-btn--danger"
                    aria-label="Supprimer"
                    onClick={() => onDelete(id)}
                >
                    <Trash2 size={13} aria-hidden="true" />
                </button>
            </div>
        </li>
    );
}

function NotificationDropdown({ notifications, isLoading, onMarkRead, onMarkAllRead, onArchive, onDelete, onClose, notifPath = '/application/notifications' }) {
    const hasUnread = notifications.some((n) => !n.is_read);

    return (
        <div className="notif-drop" role="dialog" aria-label="Notifications récentes">
            <div className="notif-drop__header">
                <span className="notif-drop__header-title">Notifications</span>
                {hasUnread && (
                    <button
                        type="button"
                        className="notif-drop__mark-all"
                        onClick={onMarkAllRead}
                        aria-label="Tout marquer comme lu"
                    >
                        <CheckCheck size={14} aria-hidden="true" />
                        Tout lire
                    </button>
                )}
            </div>

            <div className="notif-drop__body">
                {isLoading ? (
                    <div className="notif-drop__loading" aria-live="polite">
                        <Loader2 size={20} className="notif-drop__spinner" aria-hidden="true" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notif-drop__empty">
                        <Bell size={28} className="notif-drop__empty-icon" aria-hidden="true" />
                        <p className="notif-drop__empty-text">Aucune notification</p>
                    </div>
                ) : (
                    <ul className="notif-drop__list" role="list">
                        {notifications.map((n) => (
                            <NotificationItem
                                key={n.id}
                                notification={n}
                                onMarkRead={onMarkRead}
                                onArchive={onArchive}
                                onDelete={onDelete}
                            />
                        ))}
                    </ul>
                )}
            </div>

            <div className="notif-drop__footer">
                <Link
                    to={notifPath}
                    className="notif-drop__see-all"
                    onClick={onClose}
                >
                    Voir toutes les notifications
                </Link>
            </div>
        </div>
    );
}

export default NotificationDropdown;
