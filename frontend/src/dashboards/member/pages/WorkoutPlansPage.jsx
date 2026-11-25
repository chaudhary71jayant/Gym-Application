import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import { ClockIcon, DumbbellIcon } from "../../../components/ui/Icons";
import memberService from "../../../services/member.service";
import workoutService from "../../../services/workout.service";
import { WEEKDAYS } from "../../../utils/constants";
import {
  formatGoal,
  getErrorMessage,
  getTodayWeekdayKey,
} from "../../../utils/formatters";

const WorkoutPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedDay, setSelectedDay] = useState(() => getTodayWeekdayKey());
  const [restTimer, setRestTimer] = useState({ label: "", secondsLeft: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    const profileRes = await memberService.getMyMemberProfile();
    const me = profileRes?.member;
    if (!me?._id) return [];
    const res = await workoutService.getMemberWorkouts(me._id);
    return res?.workoutPlans || [];
  }, []);

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const list = await fetchAll();
      setPlans(list);
      const preferred = list.find((p) => p.isActive) || list[0];
      if (preferred) setSelectedPlanId(preferred._id);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load your workout plans."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((list) => {
        if (!active) return;
        setPlans(list);
        const preferred = list.find((p) => p.isActive) || list[0];
        if (preferred) setSelectedPlanId(preferred._id);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load your workout plans."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  useEffect(() => {
    if (restTimer.secondsLeft <= 0) return undefined;
    const id = setTimeout(() => {
      setRestTimer((prev) => ({
        ...prev,
        secondsLeft: Math.max(0, prev.secondsLeft - 1),
      }));
    }, 1000);
    return () => clearTimeout(id);
  }, [restTimer.secondsLeft]);

  const activePlan = plans.find((p) => p._id === selectedPlanId) || plans[0] || null;
  const exercises = activePlan?.weeklySchedule?.[selectedDay] || [];

  return (
    <DashboardLayout
      title="Workout Plans"
      subtitle="Follow your coach's weekly split with built-in rest timing"
    >
      {isLoading ? (
        <LoadingState label="Loading your workout plans..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadWorkouts} />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={DumbbellIcon}
          title="No workout plans assigned yet"
          description="Once your trainer creates a personalized split for you, every daily exercise will appear here."
        />
      ) : (
        <div className="space-y-6">
          {/* Rest Timer Banner if active */}
          {restTimer.secondsLeft > 0 && (
            <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/50 px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-indigo-300" />
                <div>
                  <p className="text-xs font-semibold text-indigo-200">
                    Rest Timer — {restTimer.label}
                  </p>
                  <p className="text-xl font-bold text-white font-mono tabular-nums">
                    {restTimer.secondsLeft}s remaining
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestTimer({ label: "", secondsLeft: 0 })}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
              >
                Stop Timer
              </button>
            </div>
          )}

          {/* Plan Selector if multiple */}
          {plans.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {plans.map((plan) => (
                <button
                  key={plan._id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan._id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border transition shrink-0 flex items-center gap-2 ${
                    activePlan?._id === plan._id
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white"
                  }`}
                >
                  <span>{plan.title}</span>
                  {plan.isActive && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px]">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selected Plan Card */}
          {activePlan && (
            <div className="glass-card rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-white">
                      {activePlan.title}
                    </h2>
                    <StatusBadge
                      status={activePlan.isActive ? "active" : "inactive"}
                    />
                  </div>
                  {activePlan.description && (
                    <p className="text-sm text-slate-300 mt-1.5">
                      {activePlan.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Goal:{" "}
                    <strong className="text-slate-200">
                      {formatGoal(activePlan.goal)}
                    </strong>{" "}
                    · Duration:{" "}
                    <strong className="text-slate-200">
                      {activePlan.durationWeeks} week(s)
                    </strong>
                    {activePlan.createdBy?.user?.name
                      ? ` · Coach: ${activePlan.createdBy.user.name}`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Weekday Tabs */}
              <div
                role="tablist"
                aria-label="Workout days"
                className="flex gap-2 overflow-x-auto pb-1"
              >
                {WEEKDAYS.map((day) => {
                  const count = activePlan.weeklySchedule?.[day.key]?.length || 0;
                  const isSelected = selectedDay === day.key;
                  const isToday = day.key === getTodayWeekdayKey();
                  return (
                    <button
                      key={day.key}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedDay(day.key)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white"
                      }`}
                    >
                      <span>
                        {day.label}
                        {isToday ? " (Today)" : ""}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Exercises for Selected Day */}
              {exercises.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center">
                  <p className="text-base font-semibold text-white">
                    Rest &amp; Active Recovery
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    No exercises scheduled for{" "}
                    {WEEKDAYS.find((d) => d.key === selectedDay)?.label}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exercises.map((ex, idx) => (
                    <div
                      key={`${ex.name}-${idx}`}
                      className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-bold text-white">
                            {idx + 1}. {ex.name}
                          </h3>
                          <span className="text-xs font-mono font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-1 rounded-lg shrink-0">
                            {ex.sets} sets
                            {ex.reps ? ` × ${ex.reps}` : ""}
                            {ex.duration ? ` · ${ex.duration}s` : ""}
                          </span>
                        </div>
                        {ex.notes && (
                          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                            {ex.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                        <span className="text-xs text-slate-400">
                          Rest target: {ex.restTime ?? 60}s
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRestTimer({
                              label: ex.name,
                              secondsLeft: Number(ex.restTime || 60),
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-200 transition"
                        >
                          <ClockIcon className="w-3.5 h-3.5" />
                          Start {ex.restTime ?? 60}s Rest
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkoutPlansPage;
