import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import StatCard from "../../../components/ui/StatCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import Avatar from "../../../components/ui/Avatar";
import { ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import statsService from "../../../services/stats.service";
import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  formatPlanName,
  getDaysRemaining,
  getErrorMessage,
} from "../../../utils/formatters";
import {
  ActivityIcon,
  CalendarCheckIcon,
  ChevronRightIcon,
  CreditCardIcon,
  DumbbellIcon,
  UsersIcon,
} from "../../../components/ui/Icons";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await statsService.getAdminStats();
      setStats(response?.stats || null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load dashboard stats. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    statsService
      .getAdminStats()
      .then((response) => {
        if (!active) return;
        setStats(response?.stats || null);
        setError("");
      })
      .catch((err) => {
        if (active) {
          setError(
            getErrorMessage(err, "Failed to load dashboard stats. Please try again.")
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activePct =
    stats && stats.totalMembers > 0
      ? Math.round((stats.activeMembers / stats.totalMembers) * 100)
      : 0;

  return (
    <DashboardLayout
      title="Club Overview"
      subtitle="Live metrics across members, trainers, attendance, and revenue"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/members"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Members
          </Link>
          <Link
            to="/admin/payments"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition"
          >
            Payments
          </Link>
        </div>
      }
    >
      {isLoading ? (
        <LoadingState label="Loading club overview..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchStats} />
      ) : !stats ? (
        <ErrorBanner message="No dashboard data received." onRetry={fetchStats} />
      ) : (
        <div className="space-y-6">
          {/* Primary KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Total Members"
              value={stats.totalMembers}
              hint={`${activePct}% currently active`}
              icon={UsersIcon}
              tone="indigo"
            />
            <StatCard
              label="Active Members"
              value={stats.activeMembers}
              hint="Cleared for gym access"
              icon={ActivityIcon}
              tone="emerald"
            />
            <StatCard
              label="Expired Members"
              value={stats.expiredMembers}
              hint="Eligible for renewal outreach"
              icon={UsersIcon}
              tone="rose"
            />
            <StatCard
              label="Total Trainers"
              value={stats.totalTrainers}
              hint="Active coaching roster"
              icon={DumbbellIcon}
              tone="sky"
            />
            <StatCard
              label="Today's Attendance"
              value={stats.todayAttendance}
              hint="Check-ins recorded today"
              icon={CalendarCheckIcon}
              tone="amber"
            />
            <StatCard
              label="Monthly Revenue"
              value={formatCurrency(stats.monthlyRevenue)}
              hint="Confirmed payments this month"
              icon={CreditCardIcon}
              tone="violet"
            />
          </div>

          {/* Membership Health Strip */}
          <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                Club Membership Health
              </p>
              <p className="text-xs text-slate-400">
                {stats.activeMembers} active out of {stats.totalMembers} registered members ({activePct}%)
              </p>
            </div>
            <div className="w-full md:w-80 space-y-1.5">
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
                  style={{ width: `${activePct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Active: {stats.activeMembers}</span>
                <span>Expired: {stats.expiredMembers}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiring Soon */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-white">Expiring Soon</h3>
                  <span className="text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    Next 7 Days
                  </span>
                </div>
                <Link
                  to="/admin/members"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition"
                >
                  Members <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>

              {!stats.expiringMembers || stats.expiringMembers.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">
                  No memberships expiring within the next 7 days.
                </p>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {stats.expiringMembers.map((member) => {
                    const daysLeft = getDaysRemaining(member.membershipEnd);
                    return (
                      <div
                        key={member._id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={member.user?.profileImage}
                            name={member.user?.name}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {member.user?.name || "Member"}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {member.user?.email}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-amber-300 tabular-nums">
                            {daysLeft !== null ? `${Math.max(0, daysLeft)} day(s) left` : "Expiring"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatDate(member.membershipEnd)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Payments */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Recent Payments</h3>
                  <p className="text-xs text-slate-400">Latest club fee transactions</p>
                </div>
                <Link
                  to="/admin/payments"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition"
                >
                  All payments <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>

              {!stats.recentPayments || stats.recentPayments.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">
                  No recent payments recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {stats.recentPayments.map((payment) => (
                    <div
                      key={payment._id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {payment.member?.user?.name || "Unknown Member"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatPaymentMethod(payment.paymentMethod)} ·{" "}
                          {formatPlanName(payment.membershipPlan)} ·{" "}
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="text-sm font-bold text-emerald-300 tabular-nums">
                          {formatCurrency(payment.amount)}
                        </p>
                        <StatusBadge status={payment.paymentStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
