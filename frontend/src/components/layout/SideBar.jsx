import { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { ROLE_PROFILE_ROUTES } from "../../utils/constants";
import Avatar from "../ui/Avatar";
import {
  CalendarCheckIcon,
  CloseIcon,
  CreditCardIcon,
  DashboardIcon,
  DumbbellIcon,
  LogOutIcon,
  BellIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
  UtensilsIcon,
} from "../ui/Icons";

const NAV_LINKS = {
  superAdmin: [
    { label: "Dashboard", path: "/superadmin/dashboard", icon: DashboardIcon },
    { label: "Manage Admins", path: "/superadmin/admins", icon: ShieldIcon },
  ],
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: DashboardIcon },
    { label: "Members", path: "/admin/members", icon: UsersIcon },
    { label: "Trainers", path: "/admin/trainers", icon: DumbbellIcon },
    { label: "Payments", path: "/admin/payments", icon: CreditCardIcon },
    { label: "Attendance", path: "/admin/attendance", icon: CalendarCheckIcon },
  ],
  trainer: [
    { label: "Dashboard", path: "/trainer/dashboard", icon: DashboardIcon },
    { label: "My Members", path: "/trainer/members", icon: UsersIcon },
  ],
  member: [
    { label: "Dashboard", path: "/member/dashboard", icon: DashboardIcon },
    { label: "Check In / Out", path: "/member/checkin", icon: CalendarCheckIcon },
    { label: "Workout Plans", path: "/member/workouts", icon: DumbbellIcon },
    { label: "Diet Plans", path: "/member/diets", icon: UtensilsIcon },
    { label: "Payments", path: "/member/payments", icon: CreditCardIcon },
    { label: "Notifications", path: "/member/notifications", icon: BellIcon },
  ],
};

const ROLE_DISPLAY = {
  superAdmin: "Super Admin",
  admin: "Club Admin",
  trainer: "Coach / Trainer",
  member: "Member",
};

const SidebarContent = ({ onNavigate, showCloseButton, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = NAV_LINKS[user?.role] || [];
  const profilePath = ROLE_PROFILE_ROUTES[user?.role] || "/login";

  const handleLogout = async () => {
    onClose?.();
    await logout();
    navigate("/login");
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-950/60 shrink-0">
            <DumbbellIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white leading-none">
              Gym<span className="text-indigo-400">Pro</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              {ROLE_DISPLAY[user?.role] || "Portal"}
            </p>
          </div>
        </div>

        {showCloseButton && (
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition lg:hidden"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav aria-label="Primary" className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </p>

        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-400"
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? "text-indigo-300"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Account
          </p>
          <NavLink
            to={profilePath}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-400"
                  />
                )}
                <UserIcon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? "text-indigo-300"
                      : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span>Profile &amp; Security</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Footer User Card & Logout */}
      <div className="p-3 border-t border-slate-800/80 space-y-2.5">
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <Avatar src={user?.profileImage} name={user?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 border border-transparent hover:border-rose-500/25 transition"
        >
          <LogOutIcon className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const drawerRef = useRef(null);
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (isMobileOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isMobileOpen && dialog.open) {
      dialog.close();
    }
  }, [isMobileOpen]);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return undefined;

    const handleClose = () => {
      dialog.returnValue = "";
      onCloseMobile?.();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onCloseMobile]);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return undefined;

    const isOutside = (e) => {
      const rect = dialog.getBoundingClientRect();
      return (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      );
    };

    const onDown = (e) => {
      pressedOutsideRef.current = isOutside(e);
    };
    const onUp = (e) => {
      if (pressedOutsideRef.current && isOutside(e)) {
        dialog.close();
      }
      pressedOutsideRef.current = false;
    };

    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Modal Navigation Drawer */}
      <dialog
        ref={drawerRef}
        id="mobile-nav-drawer"
        closedby="any"
        aria-label="Navigation menu"
        className="mobile-drawer lg:hidden shadow-2xl"
      >
        <SidebarContent
          showCloseButton
          onClose={() => drawerRef.current?.close()}
          onNavigate={() => drawerRef.current?.close()}
        />
      </dialog>
    </>
  );
};

export default Sidebar;
