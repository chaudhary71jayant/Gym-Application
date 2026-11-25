import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import StatCard from "../../../components/ui/StatCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import Avatar from "../../../components/ui/Avatar";
import { ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import userService from "../../../services/user.service";
import memberService from "../../../services/member.service";
import trainerService from "../../../services/trainer.service";
import { formatDate, formatSpecialization, getErrorMessage } from "../../../utils/formatters";
import {
  ActivityIcon,
  ChevronRightIcon,
  DumbbellIcon,
  ShieldIcon,
  UsersIcon,
} from "../../../components/ui/Icons";

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    const [adminsRes, membersRes, trainersRes] = await Promise.all([
      userService.getAllAdmins(),
      memberService.getAllMembers(),
      trainerService.getAllTrainers(),
    ]);
    return {
      admins: adminsRes?.admins || [],
      members: membersRes?.members || [],
      trainers: trainersRes?.trainers || [],
    };
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAll();
      setAdmins(data.admins);
      setMembers(data.members);
      setTrainers(data.trainers);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load system overview."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((data) => {
        if (!active) return;
        setAdmins(data.admins);
        setMembers(data.members);
        setTrainers(data.trainers);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load system overview."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const activeAdmins = admins.filter((a) => a.isActive !== false).length;
  const activeMembers = members.filter((m) => m.membershipStatus === "active").length;
  const expiredMembers = members.filter((m) => m.membershipStatus === "expired").length;
  const pendingMembers = members.filter((m) => m.membershipStatus === "pending").length;

  const totalTrainerCapacity = trainers.reduce(
    (sum, t) => sum + (t.maxCapacity || 30),
    0
  );
  const totalAssignedLoad = trainers.reduce(
    (sum, t) => sum + (t.assignedMembers?.length || 0),
    0
  );

  return (
    <DashboardLayout
      title="System Control Center"
      subtitle="Manage club administrators and monitor platform health"
      actions={
        <Link
          to="/superadmin/admins"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
        >
          <ShieldIcon className="w-4 h-4" />
          Manage Admins
        </Link>
      }
    >
      {isLoading ? (
        <LoadingState label="Loading system overview..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadData} />
      ) : (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Total Admins"
              value={admins.length}
              hint={`${activeAdmins} active account(s)`}
              icon={ShieldIcon}
              tone="indigo"
            />
            <StatCard
              label="Gym Members"
              value={members.length}
              hint={`${activeMembers} active · ${expiredMembers} expired`}
              icon={UsersIcon}
              tone="emerald"
            />
            <StatCard
              label="Coaching Staff"
              value={trainers.length}
              hint={`${totalAssignedLoad} / ${totalTrainerCapacity || 0} slots filled`}
              icon={DumbbellIcon}
              tone="sky"
            />
            <StatCard
              label="Pending Memberships"
              value={pendingMembers}
              hint="Awaiting activation or renewal"
              icon={ActivityIcon}
              tone="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Recent Admin Accounts */}
            <div className="lg:col-span-3 glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Club Administrators</h3>
                  <p className="text-xs text-slate-400">
                    Recently provisioned admin operators
                  </p>
                </div>
                <Link
                  to="/superadmin/admins"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition"
                >
                  View all <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>

              {admins.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">
                  No admin accounts found. Create your first admin to begin club setup.
                </p>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {admins.slice(0, 6).map((admin) => (
                    <div
                      key={admin._id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={admin.profileImage} name={admin.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {admin.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {admin.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:inline text-xs text-slate-400">
                          {formatDate(admin.createdAt)}
                        </span>
                        <StatusBadge
                          status={admin.isActive !== false ? "active" : "inactive"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Capacity Snapshot */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Club Snapshot</h3>
                <p className="text-xs text-slate-400">
                  Membership status and trainer allocation
                </p>
              </div>

              {/* Membership Distribution */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Active Membership Rate</span>
                  <span className="text-emerald-300 font-semibold tabular-nums">
                    {members.length > 0
                      ? Math.round((activeMembers / members.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
                  {members.length > 0 && (
                    <>
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(activeMembers / members.length) * 100}%` }}
                      />
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${(pendingMembers / members.length) * 100}%` }}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${(expiredMembers / members.length) * 100}%` }}
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                  <span>● Active: {activeMembers}</span>
                  <span>◷ Pending: {pendingMembers}</span>
                  <span>! Expired: {expiredMembers}</span>
                </div>
              </div>

              {/* Trainer Roster Summary */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Top Trainer Utilization
                </p>
                {trainers.length === 0 ? (
                  <p className="text-xs text-slate-500">No trainers registered yet.</p>
                ) : (
                  trainers.slice(0, 4).map((trainer) => {
                    const load = trainer.assignedMembers?.length || 0;
                    const max = trainer.maxCapacity || 30;
                    const pct = Math.min(100, Math.round((load / max) * 100));
                    return (
                      <div key={trainer._id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 font-medium truncate">
                            {trainer.user?.name || "Trainer"}{" "}
                            <span className="text-slate-400">
                              · {formatSpecialization(trainer.specialization)}
                            </span>
                          </span>
                          <span className="text-slate-400 tabular-nums shrink-0">
                            {load}/{max}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
