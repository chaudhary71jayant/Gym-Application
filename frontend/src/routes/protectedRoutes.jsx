import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROLE_HOME_ROUTES } from "../utils/constants";

const ProtectedRoutes = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME_ROUTES[user.role] || "/login"} replace />;
  }

  return children;
};

export default ProtectedRoutes;
