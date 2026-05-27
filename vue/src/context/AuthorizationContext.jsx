import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    clearAuthorizationSession,
    createSessionTimeout,
    getAuthorizationSession,
    isSessionExpired,
    logoutAuthorizationFromApi,
    recoverAuthorizationSessionFromApi,
    selectRoleFromApi,
    wasAuthorizationSessionActive,
} from '../utils/authorization';

import '../assets/styles/components/AuthorizationContext.css';

export const AuthorizationContext = createContext({
    isAuthorized: false,
    isLoading: true,
    user: null,
    logoutError: null,
    selectRole: async () => false,
    logoutAuthorization: async () => false,
});

export const AuthorizationProvider = ({ children }) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
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
        setIsAuthorized(false);
        setUser(null);
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
            clearAuthorizationSession();
            clearState();
            navigate('/login', { replace: true });
        });

        setUser(session.user);
        setIsAuthorized(true);
        return true;
    }, [clearState, navigate]);

    useEffect(() => {
        async function initSession() {
            const stored = getAuthorizationSession();

            if (stored) {
                if (isSessionExpired(stored.expiresAt)) {
                    clearAuthorizationSession();
                    clearState();
                    setIsLoading(false);
                    navigate('/login', { replace: true });
                    return;
                }
                applySession(stored);
                setIsLoading(false);
                return;
            }

            if (wasAuthorizationSessionActive()) {
                try {
                    const recovered = await recoverAuthorizationSessionFromApi();
                    applySession(recovered);
                } catch {
                    clearState();
                }
            }

            setIsLoading(false);
        }

        initSession();
    }, []);

    const selectRole = async (payload) => {
        setIsLoading(true);
        try {
            const session = await selectRoleFromApi(payload);
            const success = applySession(session);
            return success;
        } catch {
            clearState();
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logoutAuthorization = useCallback(async () => {
        setLogoutError(null);
        try {
            await logoutAuthorizationFromApi();
            clearState();
            return true;
        } catch {
            setLogoutError('Déconnexion impossible, vérifiez votre connexion.');
            return false;
        }
    }, [clearState]);

    const dismissLogoutError = useCallback(() => setLogoutError(null), []);

    return (
        <AuthorizationContext.Provider value={{ isAuthorized, isLoading, user, logoutError, selectRole, logoutAuthorization }}>
            {children}
            {logoutError && (
                <div className="authorizationContext-logoutError" role="alert">
                    <p className="authorizationContext-logoutError__message">{logoutError}</p>
                    <button
                        type="button"
                        className="authorizationContext-logoutError__close"
                        onClick={dismissLogoutError}
                        aria-label="Fermer"
                    >
                        &times;
                    </button>
                </div>
            )}
        </AuthorizationContext.Provider>
    );
};

export default AuthorizationContext;
