import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';

const RouteGuardAuth = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { isAuthorized, isLoading: authorizationLoading } = useAuthorization();
    const location = useLocation();

    if (authLoading || authorizationLoading) {
        return null;
    }

    if (isAuthorized) {
        return <Navigate to="/404" replace state={{ from: location, fallback: '/application' }} />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
};

export default RouteGuardAuth;
