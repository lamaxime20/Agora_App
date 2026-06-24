import { useCallback, useState } from 'react';

import {
    archiveAll,
    archiveNotification,
    deleteArchivedNotifications,
    deleteNotification,
    deleteNotificationsBulk,
    getNotifications,
    markAllRead,
    markRead,
} from '../services/notifications';

/**
 * Hook for the full notifications page — handles paginated list, filters,
 * and bulk actions. For the real-time badge / dropdown use NotificationsContext.
 */
export function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const fetchPage = useCallback(async (p = page, f = filter, s = search) => {
        setIsLoading(true);
        try {
            const data = await getNotifications({ page: p, limit: 25, filter: f, search: s });
            const inner = data?.data ?? {};
            setNotifications(inner.notifications ?? []);
            setTotalPages(inner.total ? Math.ceil(inner.total / 25) : 1);
        } finally {
            setIsLoading(false);
        }
    }, [page, filter, search]);

    const handleMarkRead = useCallback(async (id) => {
        await markRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
    }, []);

    const handleMarkAllRead = useCallback(async () => {
        await markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }, []);

    const handleArchive = useCallback(async (id) => {
        await archiveNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const handleArchiveAll = useCallback(async () => {
        await archiveAll();
        setNotifications([]);
    }, []);

    const handleDelete = useCallback(async (id) => {
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const handleDeleteBulk = useCallback(async (ids) => {
        await deleteNotificationsBulk(ids);
        setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    }, []);

    const handleDeleteArchived = useCallback(async () => {
        await deleteArchivedNotifications();
        if (filter === 'archived') setNotifications([]);
    }, [filter]);

    const changeFilter = useCallback((f) => {
        setFilter(f);
        setPage(1);
        fetchPage(1, f, search);
    }, [fetchPage, search]);

    const changePage = useCallback((p) => {
        setPage(p);
        fetchPage(p, filter, search);
    }, [fetchPage, filter, search]);

    const changeSearch = useCallback((s) => {
        setSearch(s);
        setPage(1);
        fetchPage(1, filter, s);
    }, [fetchPage, filter]);

    return {
        notifications,
        totalPages,
        isLoading,
        filter,
        page,
        search,
        fetchPage,
        markRead: handleMarkRead,
        markAllRead: handleMarkAllRead,
        archiveNotification: handleArchive,
        archiveAll: handleArchiveAll,
        deleteNotification: handleDelete,
        deleteNotificationsBulk: handleDeleteBulk,
        deleteArchivedNotifications: handleDeleteArchived,
        changeFilter,
        changePage,
        changeSearch,
    };
}
