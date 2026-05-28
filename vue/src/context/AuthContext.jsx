import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    clearAuthSession,
    createSessionTimeout,
    getAuthSession,
    isSessionExpired,
    loginAuthFromApi,
    logoutAuthFromApi,
    recoverAuthSessionFromApi,
    wasAuthSessionActive,
} from '../utils/auth';
import { isUnauthorizedError } from '../utils/mockApi';
import { onSessionReset } from '../utils/session';

import '../assets/styles/components/AuthContext.css';

export const AuthContext = createContext({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    logoutError: null,
    loginAuth: async () => false,
    logoutAuth: async () => false,
});

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [logoutError, setLogoutError] = useState(null);
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    const clearState = useCallback(() => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsAuthenticated(false);
        setUser(null);
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
            clearAuthSession();
            clearState();
            navigate('/login', { replace: true });
        });

        setUser(session.user);
        setIsAuthenticated(true);
        return true;
    }, [clearState, navigate]);

    useEffect(() => {
        const unsubscribeSessionReset = onSessionReset(() => {
            clearState();
        });

        async function initSession() {
            const stored = getAuthSession();

            if (stored) {
                if (isSessionExpired(stored.expiresAt)) {
                    clearAuthSession();
                    clearState();
                    setIsLoading(false);
                    navigate('/login', { replace: true });
                    return;
                }
                applySession(stored);
                setIsLoading(false);
                return;
            }

            if (wasAuthSessionActive()) {
                try {
                    const recovered = await recoverAuthSessionFromApi();
                    applySession(recovered);
                } catch (error) {
                    if (isUnauthorizedError(error)) {
                        clearAuthSession();
                        clearState();
                        navigate('/login', { replace: true });
                        setIsLoading(false);
                        return;
                    }
                    clearState();
                }
            }

            setIsLoading(false);
        }

        initSession();

        return () => {
            unsubscribeSessionReset();
        };
    }, [applySession, clearState, navigate]);

    const loginAuth = async (credentials) => {
        setIsLoading(true);
        try {
            const session = await loginAuthFromApi(credentials);
            return applySession(session) ? session : null;
        } catch (error) {
            if (isUnauthorizedError(error)) {
                clearAuthSession();
                clearState();
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logoutAuth = useCallback(async () => {
        setLogoutError(null);
        try {
            await logoutAuthFromApi();
            clearState();
            return true;
        } catch (error) {
            if (isUnauthorizedError(error)) {
                clearAuthSession();
                clearState();
                navigate('/login', { replace: true });
                return false;
            }
            setLogoutError('Déconnexion impossible, vérifiez votre connexion.');
            return false;
        }
    }, [clearState, navigate]);

    const dismissLogoutError = useCallback(() => setLogoutError(null), []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, logoutError, loginAuth, logoutAuth }}>
            {children}
            {logoutError && (
                <div className="authContext-logoutError" role="alert">
                    <p className="authContext-logoutError__message">{logoutError}</p>
                    <button
                        type="button"
                        className="authContext-logoutError__close"
                        onClick={dismissLogoutError}
                        aria-label="Fermer"
                    >
                        &times;
                    </button>
                </div>
            )}
        </AuthContext.Provider>
    );
};

export default AuthContext;
