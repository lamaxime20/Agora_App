import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

function RouteGuardAdmin() {
    const { isAuthenticated, isLoading } = useAdmin();

    if (isLoading) {
        return (
            <div className="routeGuardAdmin-loading" aria-label="Chargement en cours">
                <div className="routeGuardAdmin-loading__spinner" aria-hidden="true" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
}

export default RouteGuardAdmin;
