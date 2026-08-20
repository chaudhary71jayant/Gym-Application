import { useAuth } from "../../context/AuthContext";

const Header = ({title}) => {
    const { user } = useAuth();

    return (
    <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-10">

      {/* Page Title */}
      <h2 className="text-white font-semibold text-lg">{title}</h2>

      {/* Right side — user info */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-white text-sm font-medium">{user?.name}</p>
          <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

    </div>
  );
};
export default Header;