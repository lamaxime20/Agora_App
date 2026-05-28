import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';

const RouteGuardAuth = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { isAuthorized, isLoading: authorizationLoading } = useAuthorization();

    if (authLoading || authorizationLoading) {
        return null;
    }

    if (isAuthorized) {
        return <Navigate to="/application" replace />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default RouteGuardAuth;
