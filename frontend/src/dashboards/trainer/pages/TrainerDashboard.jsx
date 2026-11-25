import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import Avatar from "../../../components/ui/Avatar";
import StatCard from "../../../components/ui/StatCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  ActivityIcon,
  ChevronRightIcon,
  DumbbellIcon,
  UsersIcon,
  UtensilsIcon,
} from "../../../components/ui/Icons";
import useAuth from "../../../hooks/useAuth";
import useToast from "../../../hooks/useToast";
import trainerService from "../../../services/trainer.service";
import memberService from "../../../services/member.service";
import workoutService from "../../../services/workout.service";
import dietplanServices from "../../../services/dietplan.service";
import {
  formatGoal,
  formatSpecialization,
  getErrorMessage,
} from "../../../utils/formatters";

const TrainerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [trainer, setTrainer] = useState(null);
  const [members, setMembers] = useState([]);
  const [planCounts, setPlanCounts] = useState({ workouts: 0, diets: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingAvail, setIsTogglingAvail] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    const [trainersRes, membersRes] = await Promise.all([
      trainerService.getAllTrainers(),
      memberService.getAllMembers(),
    ]);

    const allTrainers = trainersRes?.trainers || [];
    const me = allTrainers.find(
      (t) =>
        t.user?._id === user?.id ||
        t.user?.id === user?.id ||
        t.user?.email === user?.email
    );
    const assigned = membersRes?.members || [];
    let totals = { workouts: 0, diets: 0 };

    if (assigned.length > 0) {
      const planResults = await Promise.allSettled(
        assigned.map(async (m) => {
          const [wRes, dRes] = await Promise.all([
            workoutService.getMemberWorkouts(m._id),
            dietplanServices.getMemberDiet(m._id),
          ]);
          return {
            workouts: wRes?.workoutPlans?.length || 0,
            diets: dRes?.dietPlans?.length || 0,
          };
        })
      );

      totals = planResults.reduce(
        (acc, result) => {
          if (result.status === "fulfilled") {
            acc.workouts += result.value.workouts;
            acc.diets += result.value.diets;
          }
          return acc;
        },
        { workouts: 0, diets: 0 }
      );
    }

    return { trainer: me || null, members: assigned, planCounts: totals };
  }, [user?.email, user?.id]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAll();
      setTrainer(data.trainer);
      setMembers(data.members);
      setPlanCounts(data.planCounts);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load trainer dashboard."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((data) => {
        if (!active) return;
        setTrainer(data.trainer);
        setMembers(data.members);
        setPlanCounts(data.planCounts);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load trainer dashboard."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const handleToggleAvailability = async () => {
    if (!trainer) return;
    setIsTogglingAvail(true);
    const nextAvail = !trainer.isAvailable;
    try {
      await trainerService.updateTrainer(trainer._id, { isAvailable: nextAvail });
      setTrainer((prev) => ({ ...prev, isAvailable: nextAvail }));
      showToast(
        `Status updated to ${nextAvail ? "Available" : "Unavailable"} for new clients.`
      );
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update availability."), "error");
    } finally {
      setIsTogglingAvail(false);
    }
  };

  const capacity = trainer?.maxCapacity || 30;
  const capacityPct = Math.min(100, Math.round((members.length / capacity) * 100));

  return (
    <DashboardLayout
      title="Coach Workspace"
      subtitle="Monitor assigned clients, workouts, and nutrition programming"
      actions={
        <Link
          to="/trainer/members"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition"
        >
          <UsersIcon className="w-4 h-4" />
          My Members
        </Link>
      }
    >
      {isLoading ? (
        <LoadingState label="Loading coach dashboard..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadDashboard} />
      ) : (
        <div className="space-y-6">
          {/* Coach Banner */}
          {trainer && (
            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={trainer.user?.profileImage}
                  name={trainer.user?.name}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-bold text-white">
                      {trainer.user?.name}
                    </h2>
                    <StatusBadge
                      status={trainer.isAvailable ? "available" : "unavailable"}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatSpecialization(trainer.specialization)} ·{" "}
                    {trainer.experience ?? 0} years coaching experience
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isTogglingAvail}
                onClick={handleToggleAvailability}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition disabled:opacity-50 self-start md:self-auto"
              >
                {isTogglingAvail
                  ? "Updating..."
                  : trainer.isAvailable
                  ? "Set Unavailable"
                  : "Set Available"}
              </button>
            </div>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Assigned Clients"
              value={members.length}
              hint={`${capacityPct}% of ${capacity} max capacity`}
              icon={UsersIcon}
              tone="indigo"
            />
            <StatCard
              label="Active Memberships"
              value={members.filter((m) => m.membershipStatus === "active").length}
              hint="Currently active gym access"
              icon={ActivityIcon}
              tone="emerald"
            />
            <StatCard
              label="Workout Plans"
              value={planCounts.workouts}
              hint="Across assigned roster"
              icon={DumbbellIcon}
              tone="sky"
            />
            <StatCard
              label="Diet Plans"
              value={planCounts.diets}
              hint="Nutrition schedules built"
              icon={UtensilsIcon}
              tone="amber"
            />
          </div>

          {/* Client Roster Preview */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Assigned Roster</h3>
                <p className="text-xs text-slate-400">
                  Select any client to build workout splits, meals, or inspect attendance
                </p>
              </div>
              <Link
                to="/trainer/members"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition"
              >
                Full roster <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>

            {members.length === 0 ? (
              <EmptyState
                icon={UsersIcon}
                title="No members assigned yet"
                description="Once a Club Admin assigns members to you, they will appear here ready for coaching."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {members.map((member) => (
                  <Link
                    key={member._id}
                    to={`/trainer/members/${member._id}`}
                    className="rounded-2xl border border-slate-800/90 bg-slate-900/60 hover:bg-slate-800/60 hover:border-indigo-500/40 p-4 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={member.user?.profileImage}
                        name={member.user?.name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {member.user?.name || "Member"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {formatGoal(member.fitnessGoal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={member.membershipStatus} />
                      <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TrainerDashboard;
