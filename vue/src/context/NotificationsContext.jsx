import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

import AuthorizationContext from './AuthorizationContext';
import { BASE_URL } from '../services/api';
import {
    archiveNotification,
    deleteNotification,
    getNotifications,
    getUnreadCount,
    markAllRead,
    markRead,
} from '../services/notifications';

window.Pusher = Pusher;

export const NotificationsContext = createContext({
    unreadCount: 0,
    recentNotifications: [],
    isLoadingRecent: false,
    markRead: async () => {},
    markAllRead: async () => {},
    archiveNotification: async () => {},
    deleteNotification: async () => {},
    refreshRecent: async () => {},
    refreshUnreadCount: async () => {},
});

function createEcho() {
    const authUrl = `${BASE_URL}/api/broadcasting/auth`;

    return new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        // Pusher-js uses its own XHR internally which does NOT send cookies
        // cross-origin by default. A custom authorizer using fetch() with
        // credentials:'include' is the only reliable way to send the cookie.
        authorizer: (channel) => ({
            authorize: (socketId, callback) => {
                fetch(authUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                    .then((res) => {
                        if (!res.ok) throw new Error(`Auth ${res.status}`);
                        return res.json();
                    })
                    .then((data) => callback(null, data))
                    .catch((err) => callback(err, null));
            },
        }),
    });
}

export function NotificationsProvider({ children }) {
    const { user, isAuthorized } = useContext(AuthorizationContext);

    const [unreadCount, setUnreadCount] = useState(0);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [isLoadingRecent, setIsLoadingRecent] = useState(false);

    const echoRef = useRef(null);

    const userId = user?.id;
    const companyId = user?.entreprise?.id;
    const roleId = user?.role_id;
    const canSubscribe = isAuthorized && Boolean(userId && companyId && roleId);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const data = await getUnreadCount();
            setUnreadCount(data?.data?.count ?? 0);
        } catch {
            // silently ignore
        }
    }, []);

    const refreshRecent = useCallback(async () => {
        setIsLoadingRecent(true);
        try {
            const data = await getNotifications({ page: 1, limit: 10, filter: 'all' });
            setRecentNotifications(data?.data?.notifications ?? []);
        } catch {
            // silently ignore
        } finally {
            setIsLoadingRecent(false);
        }
    }, []);

    // Bootstrap: load unread count + recent on mount
    useEffect(() => {
        if (!canSubscribe) {
            setUnreadCount(0);
            setRecentNotifications([]);
            return;
        }
        refreshUnreadCount();
        refreshRecent();
    }, [canSubscribe, refreshUnreadCount, refreshRecent]);

    // Reverb WebSocket subscription
    useEffect(() => {
        if (!canSubscribe) return;

        const echo = createEcho();
        echoRef.current = echo;

        const channelName = `notifications.${userId}.${companyId}.${roleId}`;

        echo.private(channelName).listen('.notification.created', (payload) => {
            setUnreadCount((prev) => prev + 1);
            setRecentNotifications((prev) => {
                const n = {
                    id: payload.id,
                    type: payload.type,
                    title: payload.title,
                    message: payload.message,
                    priority: payload.priority,
                    data: payload.data,
                    created_at: payload.created_at,
                    is_read: false,
                };
                return [n, ...prev].slice(0, 10);
            });
        });

        return () => {
            echo.leave(channelName);
            echoRef.current = null;
        };
    }, [canSubscribe, userId, companyId, roleId]);

    const handleMarkRead = useCallback(async (id) => {
        await markRead(id);
        setRecentNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    const handleMarkAllRead = useCallback(async () => {
        await markAllRead();
        setRecentNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }, []);

    const handleArchive = useCallback(async (id) => {
        const target = recentNotifications.find((n) => n.id === id);
        await archiveNotification(id);
        setRecentNotifications((prev) => prev.filter((n) => n.id !== id));
        if (target && !target.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    }, [recentNotifications]);

    const handleDelete = useCallback(async (id) => {
        const target = recentNotifications.find((n) => n.id === id);
        await deleteNotification(id);
        setRecentNotifications((prev) => prev.filter((n) => n.id !== id));
        if (target && !target.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    }, [recentNotifications]);

    return (
        <NotificationsContext.Provider value={{
            unreadCount,
            recentNotifications,
            isLoadingRecent,
            markRead: handleMarkRead,
            markAllRead: handleMarkAllRead,
            archiveNotification: handleArchive,
            deleteNotification: handleDelete,
            refreshRecent,
            refreshUnreadCount,
        }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotificationsContext() {
    return useContext(NotificationsContext);
}

export default NotificationsContext;
