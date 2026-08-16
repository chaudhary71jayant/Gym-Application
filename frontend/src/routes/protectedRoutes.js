import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoutes = ({ children , allowedRoles }) => {
    const { user, isAuthenticated } = useAuth();

    if(!isAuthenticated){
        return <Navigate to="/login" replace />
    }

    if(!allowedRoles.includes(user.role)){
        const roleRedirects = {
            superAdmin : "/superadmin/dashboard",
            admin : "/admin/dashboard",
            trainer : "/trainer/dashboard",
            member : "/member/dashboard",
        };

        return <Navigate to={roleRedirects[user.role]} replace />;
    }
    return children;
}

export default ProtectedRoutes;