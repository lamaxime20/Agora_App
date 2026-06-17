import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    clearAdminSession,
    createSessionTimeout,
    getAdminSession,
    isSessionExpired,
    loginAdminFromApi,
    logoutAdminFromApi,
} from '../utils/adminAuth';

import '../assets/styles/components/AdminContext.css';

export const AdminContext = createContext({
    isAuthenticated: false,
    isLoading: true,
    admin: null,
    logoutError: null,
    loginAdmin: async () => null,
    logoutAdmin: async () => false,
});

export const AdminProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [admin, setAdmin] = useState(null);
    const [logoutError, setLogoutError] = useState(null);
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    const clearState = useCallback(() => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsAuthenticated(false);
        setAdmin(null);
        setLogoutError(null);
    }, []);

    const applySession = useCallback((session) => {
        if (!session || isSessionExpired(session.expiresAt)) {
            clearState();
            return false;
        }

        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = createSessionTimeout(session.expiresAt, () => {
            clearAdminSession();
            clearState();
            navigate('/admin/login', { replace: true });
        });

        setAdmin(session.admin);
        setIsAuthenticated(true);
        return true;
    }, [clearState, navigate]);

    useEffect(() => {
        const stored = getAdminSession();

        if (stored) {
            if (isSessionExpired(stored.expiresAt)) {
                clearAdminSession();
                clearState();
                setIsLoading(false);
                navigate('/admin/login', { replace: true });
                return;
            }
            applySession(stored);
        }

        setIsLoading(false);
    }, [applySession, clearState, navigate]);

    const loginAdmin = async (credentials) => {
        setIsLoading(true);
        try {
            const session = await loginAdminFromApi(credentials);
            applySession(session);
            return session;
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logoutAdmin = useCallback(async () => {
        setLogoutError(null);
        try {
            await logoutAdminFromApi();
            clearState();
            navigate('/admin/login', { replace: true });
            return true;
        } catch {
            setLogoutError('Déconnexion impossible, vérifiez votre connexion.');
            return false;
        }
    }, [clearState, navigate]);

    const dismissLogoutError = useCallback(() => setLogoutError(null), []);

    return (
        <AdminContext.Provider value={{ isAuthenticated, isLoading, admin, logoutError, loginAdmin, logoutAdmin }}>
            {children}
            {logoutError && (
                <div className="adminContext-logoutError" role="alert">
                    <p className="adminContext-logoutError__message">{logoutError}</p>
                    <button
                        type="button"
                        className="adminContext-logoutError__close"
                        onClick={dismissLogoutError}
                        aria-label="Fermer"
                    >
                        &times;
                    </button>
                </div>
            )}
        </AdminContext.Provider>
    );
};

export function useAdmin() {
    return useContext(AdminContext);
}

export default AdminContext;
