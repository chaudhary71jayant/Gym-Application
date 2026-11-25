import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  AlertTriangleIcon,
  BellIcon,
  CheckCircleIcon,
  CheckIcon,
  CreditCardIcon,
  DumbbellIcon,
  TrashIcon,
} from "../../../components/ui/Icons";
import useToast from "../../../hooks/useToast";
import notificationService from "../../../services/notification.service";
import { formatDate, formatTime, getErrorMessage } from "../../../utils/formatters";

const getTypeConfig = (type) => {
  switch (type) {
    case "payment_success":
      return {
        icon: CreditCardIcon,
        tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        to: "/member/payments",
        linkLabel: "View Payments",
      };
    case "payment_failed":
    case "membership_expiry":
    case "membership_expired":
      return {
        icon: AlertTriangleIcon,
        tone: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        to: "/member/payments",
        linkLabel: "Check Membership",
      };
    case "plan_assigned":
    case "trainer_assigned":
      return {
        icon: DumbbellIcon,
        tone: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
        to: "/member/workouts",
        linkLabel: "View Plans",
      };
    case "missed_session":
      return {
        icon: BellIcon,
        tone: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        to: "/member/checkin",
        linkLabel: "Go to Check-In",
      };
    default:
      return {
        icon: CheckCircleIcon,
        tone: "bg-sky-500/15 text-sky-300 border-sky-500/30",
        to: null,
        linkLabel: null,
      };
  }
};

const NotificationsPage = () => {
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await notificationService.getMyNotifications(onlyUnread);
      setNotifications(res?.notifications || []);
      setUnreadCount(res?.unreadCount || 0);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load notifications."));
    } finally {
      setIsLoading(false);
    }
  }, [onlyUnread]);

  useEffect(() => {
    let active = true;
    notificationService
      .getMyNotifications(onlyUnread)
      .then((res) => {
        if (!active) return;
        setNotifications(res?.notifications || []);
        setUnreadCount(res?.unreadCount || 0);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load notifications."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onlyUnread]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        onlyUnread
          ? prev.filter((n) => n._id !== id)
          : prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      showToast(getErrorMessage(err, "Could not mark notification as read."), "error");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        onlyUnread ? [] : prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
      showToast("All notifications marked as read.");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to mark all as read."), "error");
    }
  };

  const handleDelete = async (id, wasUnread) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      showToast("Notification deleted.");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete notification."), "error");
    }
  };

  return (
    <DashboardLayout
      title="Notifications"
      subtitle="Plan assignments, payment confirmations, and attendance alerts"
      actions={
        unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            <CheckIcon className="w-4 h-4" />
            Mark All Read ({unreadCount})
          </button>
        )
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyUnread(false)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                !onlyUnread
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white"
              }`}
            >
              All Alerts
            </button>
            <button
              type="button"
              onClick={() => setOnlyUnread(true)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                onlyUnread
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading notifications..." />
        ) : error ? (
          <ErrorBanner message={error} onRetry={fetchNotifications} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={BellIcon}
            title={onlyUnread ? "No unread notifications" : "No notifications yet"}
            description="When your trainer assigns a plan or your membership updates, alerts appear here."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const cfg = getTypeConfig(notif.type);
              const Icon = cfg.icon;
              const smartTo =
                notif.type === "plan_assigned" && notif.link?.includes("diet")
                  ? "/member/diets"
                  : cfg.to;

              return (
                <div
                  key={notif._id}
                  className={`glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    notif.isRead ? "opacity-75" : "border-indigo-500/35"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${cfg.tone}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">
                          {notif.title}
                        </h3>
                        {!notif.isRead && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5">
                        {formatDate(notif.createdAt)} · {formatTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {smartTo && (
                      <Link
                        to={smartTo}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                      >
                        {cfg.linkLabel}
                      </Link>
                    )}

                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition"
                      >
                        Mark Read
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(notif._id, !notif.isRead)}
                      aria-label="Delete notification"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
