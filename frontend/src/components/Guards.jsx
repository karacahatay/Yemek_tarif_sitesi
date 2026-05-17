import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Giriş zorunlu. roles verilirse role kontrolü de yapar.
export function RequireAuth({ children, roles }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return null;
    if (!user) {
        const url = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={"/login?url=" + url} replace />;
    }
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
        return (
            <div className="alert error">
                Bu sayfaya erişim yetkin yok.
            </div>
        );
    }
    return children;
}
