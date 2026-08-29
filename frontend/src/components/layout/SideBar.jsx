import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navLinks = {
    superAdmin : [
        { label : "Dashboard", path : "/superadmin/dashboard"},
        { label : "Manage Admins", path : "/superadmin/admins" },
    ],
    admin : [
        { label : "Dashboard", path : "admin/dashboard" },
        { label : "Members", path : "/admin/members"},
        { label : "Trainer", path : "/admin/trainers" },
        { label : "Payments", path : "/admin/payments" },
        { label : "Attendance", path : "/admin/attendance" },
    ],
    trainer : [
        { label : "Dashboard", path : "/trainer/dashboard" },
        { label : "My Members", path : "/trainer/members"},
    ],
    member : [
        { label : "Dashboard", path : "/member/dashboard"},
        { label : "check In/Out", path : "/member/checkin"},
        { label : "Workout Plans", path : "/member/workouts" },
        { label : "Diet Plans" , path : "/member/diets"},
        { label : "Payments", path : "/member/payments"},
        { label : "Notifications", path : "/member/notifications" }
    ]
};

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const links = navLinks[user?.role] || [];

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
    <div className="h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed left-0 top-0">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-500">GymPro</h1>
        <p className="text-xs text-gray-500 mt-0.5">Management System</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"        // active link
                  : "text-gray-400 hover:bg-gray-800 hover:text-white" // inactive
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}

        {/* Profile link — same for all roles */}
        <NavLink
          to={`/${user?.role}/profile`}
          className={({ isActive }) =>
            `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          Profile
        </NavLink>
      </nav>

      {/* User info + Logout at bottom */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3 px-2">
          {/* Avatar — first letter of user's name */}
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
        >
          Logout
        </button>
      </div>

    </div>
  );
};

export default Sidebar;