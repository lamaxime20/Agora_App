import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';

const RouteGuardAuthorization = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { isAuthorized, isLoading: authorizationLoading } = useAuthorization();

    if (authLoading || authorizationLoading) {
        return null;
    }

    if (!isAuthenticated && !isAuthorized) {
        return <Navigate to="/login" replace />;
    }

    if (isAuthenticated && !isAuthorized) {
        return <Navigate to="/choix-role" replace />;
    }

    return <Outlet />;
};

export default RouteGuardAuthorization;
