import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';

const RouteGuardShared = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { isAuthorized, isLoading: authorizationLoading } = useAuthorization();
    const location = useLocation();

    if (authLoading || authorizationLoading) {
        return null;
    }

    if (!isAuthenticated && !isAuthorized) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
};

export default RouteGuardShared;
