import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import notificationService from "../../services/notification.service";
import { ROLE_PROFILE_ROUTES } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";
import Avatar from "../ui/Avatar";
import { BellIcon, CheckIcon, MenuIcon } from "../ui/Icons";

const ROLE_LABELS = {
  superAdmin: "Super Admin",
  admin: "Administrator",
  trainer: "Trainer",
  member: "Member",
};

const Header = ({
  title,
  subtitle,
  actions,
  isMobileOpen,
  onOpenMobile,
}) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifContainerRef = useRef(null);

  useEffect(() => {
    let active = true;
    notificationService
      .getMyNotifications()
      .then((res) => {
        if (!active) return;
        setUnreadCount(res?.unreadCount || 0);
        setNotifications((res?.notifications || []).slice(0, 5));
      })
      .catch(() => {
        // Ignore silent badge load failures
      });

    return () => {
      active = false;
    };
  }, [title]);

  useEffect(() => {
    if (!notifOpen) return undefined;

    const handleKey = (e) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    const handleClickOutside = (e) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [notifOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-64 z-20 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
          aria-controls="mobile-nav-drawer"
          aria-expanded={isMobileOpen}
          className="lg:hidden rounded-xl p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition shrink-0"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-white truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {actions && <div className="hidden md:flex items-center gap-2">{actions}</div>}

        {/* Quick Notifications Menu */}
        <div className="relative" ref={notifContainerRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={notifOpen}
            className="relative rounded-xl p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800/90 transition"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700/70 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-40">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-xs text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} unread alert(s)` : "All caught up"}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-300 hover:text-indigo-200 transition"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`px-4 py-3 flex items-start justify-between gap-3 ${
                        n.isRead ? "opacity-70" : "bg-indigo-500/5"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white">{n.title}</p>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkOneRead(n._id)}
                          className="text-[11px] font-medium text-indigo-300 hover:text-indigo-200 shrink-0"
                        >
                          Read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {user?.role === "member" && (
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/60 text-center">
                  <Link
                    to="/member/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition"
                  >
                    View all notifications →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <Link
          to={ROLE_PROFILE_ROUTES[user?.role] || "/login"}
          className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-slate-800/70 transition"
        >
          <Avatar src={user?.profileImage} name={user?.name} size="sm" />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white leading-tight max-w-[140px] truncate">
              {user?.name}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              {ROLE_LABELS[user?.role] || user?.role}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
