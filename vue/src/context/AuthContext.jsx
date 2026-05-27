import { createContext, useCallback, useEffect } from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    clearSession,
    createSessionTimeout,
    getSessionSnapshot,
    loginAuthFromApi,
    logoutAuthFromDatabase,
    isSessionExpired,
} from "../utils/auth";

export const AuthContext = createContext({
    isAuthenticated: false,
    isLoading: false,
    user: null,
});

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const sessionTimeoutRef = useRef(null);

    const clearAuthState = useCallback(() => {
        if (sessionTimeoutRef.current) {
            window.clearTimeout(sessionTimeoutRef.current);
            sessionTimeoutRef.current = null;
        }

        clearSession();
        setIsAuthenticated(false);
        setUser(null);
    }, []);

    const logout = useCallback(async () => {
        if (!getSessionSnapshot()) {
            clearAuthState();
            return true;
        }

        const success = await logoutAuthFromDatabase();

        clearAuthState();
        return success;
    }, [clearAuthState]);

    const logoutAndRedirectToLogin = useCallback(async () => {
        await logout();
        navigate("/login", { replace: true });
    }, [logout, navigate]);

    const applyAuthenticatedSession = useCallback((session) => {
        if (!session) {
            clearAuthState();
            return false;
        }

        if (isSessionExpired(session.expiresAt)) {
            logoutAndRedirectToLogin();
            return false;
        }

        if (sessionTimeoutRef.current) {
            window.clearTimeout(sessionTimeoutRef.current);
        }

        sessionTimeoutRef.current = createSessionTimeout(session.expiresAt, () => {
            logoutAndRedirectToLogin();
        });

        setUser(session.user);
        setIsAuthenticated(true);
        return true;
    }, [clearAuthState, logoutAndRedirectToLogin]);

    const loginAuth = async (credentials) => {
        setIsLoading(true);

        const result = await loginAuthFromApi(credentials);
        setIsLoading(false);
        
        if(!result) {
            clearAuthState();
            return false;
        }

        return applyAuthenticatedSession(result);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, loginAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;