import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Archive,
    ArrowLeft,
    Bell,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Search,
    Trash2,
} from 'lucide-react';

import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationsContext } from '../../context/NotificationsContext';
import '../../assets/styles/pages/notifications.css';

const FILTERS = [
    { key: 'all',      label: 'Toutes' },
    { key: 'unread',   label: 'Non lues' },
    { key: 'read',     label: 'Lues' },
    { key: 'archived', label: 'Archivées' },
];

const PRIORITY_LABEL = { critical: 'Critique', high: 'Haute', medium: 'Moyenne', low: 'Basse' };
const PRIORITY_CLS   = { critical: 'notifPage-priority--critical', high: 'notifPage-priority--high', medium: 'notifPage-priority--medium', low: 'notifPage-priority--low' };

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const sec  = Math.floor(diff / 1000);
    if (sec < 60)  return "À l'instant";
    const min = Math.floor(sec / 60);
    if (min < 60)  return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)    return `il y a ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 30)    return `il y a ${d} j`;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function NotificationsPage({ backPath = '/application' }) {
    const {
        notifications,
        totalPages,
        isLoading,
        filter,
        page,
        search,
        fetchPage,
        markRead,
        markAllRead,
        archiveNotification,
        archiveAll,
        deleteNotification,
        deleteNotificationsBulk,
        deleteArchivedNotifications,
        changeFilter,
        changePage,
        changeSearch,
    } = useNotifications();

    const { refreshUnreadCount } = useNotificationsContext();

    const [selected, setSelected] = useState(new Set());
    const [searchDraft, setSearchDraft] = useState('');
    const searchTimeout = useRef(null);

    // Initial fetch
    useEffect(() => {
        fetchPage(1, 'all', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const allIds = notifications.map((n) => n.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

    function toggleSelect(id) {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleSelectAll() {
        setSelected(allSelected ? new Set() : new Set(allIds));
    }

    function handleSearchInput(e) {
        const val = e.target.value;
        setSearchDraft(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => changeSearch(val), 350);
    }

    async function handleMarkRead(id) {
        await markRead(id);
        refreshUnreadCount();
    }

    async function handleMarkAllRead() {
        await markAllRead();
        refreshUnreadCount();
    }

    async function handleArchive(id) {
        await archiveNotification(id);
        refreshUnreadCount();
    }

    async function handleArchiveAll() {
        await archiveAll();
        refreshUnreadCount();
    }

    async function handleDelete(id) {
        await deleteNotification(id);
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
        refreshUnreadCount();
    }

    async function handleBulkDelete() {
        const ids = [...selected];
        await deleteNotificationsBulk(ids);
        setSelected(new Set());
        refreshUnreadCount();
    }

    async function handleDeleteArchived() {
        await deleteArchivedNotifications();
        refreshUnreadCount();
    }

    const hasUnread = notifications.some((n) => !n.is_read);

    return (
        <div className="notifPage-root">
            {/* ── Header ── */}
            <header className="notifPage-header">
                <Link to={backPath} className="notifPage-back" aria-label="Retour">
                    <ArrowLeft size={18} aria-hidden="true" />
                </Link>
                <h1 className="notifPage-title">Notifications</h1>
            </header>

            {/* ── Toolbar ── */}
            <div className="notifPage-toolbar">
                {/* Tabs */}
                <div className="notifPage-tabs" role="tablist">
                    {FILTERS.map(({ key, label }) => (
                        <button
                            key={key}
                            role="tab"
                            type="button"
                            aria-selected={filter === key}
                            className={`notifPage-tab${filter === key ? ' notifPage-tab--active' : ''}`}
                            onClick={() => { setSelected(new Set()); changeFilter(key); }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="notifPage-search" role="search">
                    <Search size={14} className="notifPage-search-icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="notifPage-search-input"
                        placeholder="Rechercher…"
                        aria-label="Rechercher dans les notifications"
                        value={searchDraft}
                        onChange={handleSearchInput}
                    />
                </div>
            </div>

            {/* ── Bulk action bar ── */}
            <div className="notifPage-actions">
                <label className="notifPage-select-all">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Tout sélectionner"
                    />
                    <span className="notifPage-select-all-label">
                        {selected.size > 0 ? `${selected.size} sélectionné${selected.size > 1 ? 's' : ''}` : 'Tout sélectionner'}
                    </span>
                </label>

                <div className="notifPage-actions-right">
                    {selected.size > 0 && (
                        <button
                            type="button"
                            className="notifPage-action-btn notifPage-action-btn--danger"
                            onClick={handleBulkDelete}
                        >
                            <Trash2 size={14} aria-hidden="true" />
                            Supprimer ({selected.size})
                        </button>
                    )}
                    {filter === 'archived' && (
                        <button type="button" className="notifPage-action-btn notifPage-action-btn--danger" onClick={handleDeleteArchived}>
                            <Trash2 size={14} aria-hidden="true" />
                            Vider les archives
                        </button>
                    )}
                    {hasUnread && filter !== 'archived' && (
                        <button type="button" className="notifPage-action-btn" onClick={handleMarkAllRead}>
                            <CheckCheck size={14} aria-hidden="true" />
                            Tout marquer lu
                        </button>
                    )}
                    {filter !== 'archived' && notifications.length > 0 && (
                        <button type="button" className="notifPage-action-btn" onClick={handleArchiveAll}>
                            <Archive size={14} aria-hidden="true" />
                            Tout archiver
                        </button>
                    )}
                </div>
            </div>

            {/* ── List ── */}
            <main className="notifPage-main">
                {isLoading ? (
                    <div className="notifPage-loading" aria-live="polite">
                        <Loader2 size={24} className="notifPage-spinner" aria-hidden="true" />
                        <p>Chargement…</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notifPage-empty">
                        <Bell size={40} className="notifPage-empty-icon" aria-hidden="true" />
                        <p className="notifPage-empty-text">Aucune notification</p>
                        {search && (
                            <p className="notifPage-empty-sub">Essayez avec d'autres mots-clés.</p>
                        )}
                    </div>
                ) : (
                    <ul className="notifPage-list" role="list">
                        {notifications.map((n) => (
                            <li
                                key={n.id}
                                className={`notifPage-item${n.is_read ? '' : ' notifPage-item--unread'}`}
                            >
                                <label className="notifPage-item-check" aria-label={`Sélectionner : ${n.title}`}>
                                    <input
                                        type="checkbox"
                                        checked={selected.has(n.id)}
                                        onChange={() => toggleSelect(n.id)}
                                    />
                                </label>

                                <div className="notifPage-item-body">
                                    <div className="notifPage-item-row1">
                                        <span className={`notifPage-priority ${PRIORITY_CLS[n.priority] ?? PRIORITY_CLS.medium}`}>
                                            {PRIORITY_LABEL[n.priority] ?? 'Moyenne'}
                                        </span>
                                        <span className="notifPage-item-time">{timeAgo(n.created_at)}</span>
                                    </div>
                                    <p className="notifPage-item-title">{n.title}</p>
                                    {n.message && <p className="notifPage-item-message">{n.message}</p>}
                                </div>

                                <div className="notifPage-item-actions">
                                    {!n.is_read && (
                                        <button
                                            type="button"
                                            className="notifPage-item-btn"
                                            aria-label="Marquer comme lu"
                                            onClick={() => handleMarkRead(n.id)}
                                        >
                                            <CheckCheck size={15} aria-hidden="true" />
                                        </button>
                                    )}
                                    {filter !== 'archived' && (
                                        <button
                                            type="button"
                                            className="notifPage-item-btn"
                                            aria-label="Archiver"
                                            onClick={() => handleArchive(n.id)}
                                        >
                                            <Archive size={15} aria-hidden="true" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="notifPage-item-btn notifPage-item-btn--danger"
                                        aria-label="Supprimer"
                                        onClick={() => handleDelete(n.id)}
                                    >
                                        <Trash2 size={15} aria-hidden="true" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <nav className="notifPage-pagination" aria-label="Pagination">
                    <button
                        type="button"
                        className="notifPage-pag-btn"
                        disabled={page <= 1}
                        onClick={() => changePage(page - 1)}
                        aria-label="Page précédente"
                    >
                        <ChevronLeft size={16} aria-hidden="true" />
                    </button>
                    <span className="notifPage-pag-label">
                        {page} / {totalPages}
                    </span>
                    <button
                        type="button"
                        className="notifPage-pag-btn"
                        disabled={page >= totalPages}
                        onClick={() => changePage(page + 1)}
                        aria-label="Page suivante"
                    >
                        <ChevronRight size={16} aria-hidden="true" />
                    </button>
                </nav>
            )}
        </div>
    );
}

export default NotificationsPage;
