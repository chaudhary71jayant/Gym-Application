import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import Avatar from "../../../components/ui/Avatar";
import StatCard from "../../../components/ui/StatCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import { ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  BellIcon,
  CalendarCheckIcon,
  ChevronRightIcon,
  ClockIcon,
  DumbbellIcon,
  FlameIcon,
  UtensilsIcon,
} from "../../../components/ui/Icons";
import useToast from "../../../hooks/useToast";
import memberService from "../../../services/member.service";
import attendanceService from "../../../services/attendance.service";
import workoutService from "../../../services/workout.service";
import dietplanServices from "../../../services/dietplan.service";
import notificationService from "../../../services/notification.service";
import {
  formatDate,
  formatGoal,
  formatPlanName,
  formatSpecialization,
  formatTime,
  getDaysRemaining,
  getErrorMessage,
  getTodayWeekdayKey,
} from "../../../utils/formatters";
import { WEEKDAYS } from "../../../utils/constants";

const isSameCalendarDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const MemberDashboard = () => {
  const { showToast } = useToast();

  const [member, setMember] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    summary: null,
    todayRecord: null,
  });
  const [workouts, setWorkouts] = useState([]);
  const [diets, setDiets] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckActionLoading, setIsCheckActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    const profileRes = await memberService.getMyMemberProfile();
    const me = profileRes?.member || null;
    if (!me?._id) {
      return {
        member: null,
        attendanceData: { summary: null, todayRecord: null },
        workouts: [],
        diets: [],
        unreadNotifications: [],
      };
    }

    const now = new Date();
    const [attRes, woRes, dietRes, notifRes] = await Promise.all([
      attendanceService.getMemberAttendance(
        me._id,
        now.getMonth() + 1,
        now.getFullYear()
      ),
      workoutService.getMemberWorkouts(me._id),
      dietplanServices.getMemberDiet(me._id),
      notificationService.getMyNotifications(true),
    ]);

    const records = attRes?.attendance || [];
    const todayRec =
      records.find((r) => isSameCalendarDay(r.date || r.checkIn, now)) || null;

    return {
      member: me,
      attendanceData: {
        summary: attRes?.summary || null,
        todayRecord: todayRec,
      },
      workouts: woRes?.workoutPlans || [],
      diets: dietRes?.dietPlans || [],
      unreadNotifications: notifRes?.notifications || [],
    };
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAll();
      setMember(data.member);
      setAttendanceData(data.attendanceData);
      setWorkouts(data.workouts);
      setDiets(data.diets);
      setUnreadNotifications(data.unreadNotifications);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load your member dashboard."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((data) => {
        if (!active) return;
        setMember(data.member);
        setAttendanceData(data.attendanceData);
        setWorkouts(data.workouts);
        setDiets(data.diets);
        setUnreadNotifications(data.unreadNotifications);
        setError("");
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Failed to load your member dashboard."));
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const handleCheckIn = async () => {
    setIsCheckActionLoading(true);
    try {
      await attendanceService.checkIn();
      showToast("Checked in! Have a great workout.");
      await loadDashboard();
    } catch (err) {
      showToast(getErrorMessage(err, "Unable to check in."), "error");
    } finally {
      setIsCheckActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsCheckActionLoading(true);
    try {
      const res = await attendanceService.checkOut();
      showToast(
        res?.sessionDuration
          ? `Checked out! Session logged (${res.sessionDuration} min).`
          : "Checked out! Great session."
      );
      await loadDashboard();
    } catch (err) {
      showToast(getErrorMessage(err, "Unable to check out."), "error");
    } finally {
      setIsCheckActionLoading(false);
    }
  };

  const activeWorkout = workouts.find((w) => w.isActive) || workouts[0] || null;
  const activeDiet = diets.find((d) => d.isActive) || diets[0] || null;
  const todayKey = getTodayWeekdayKey();
  const todayLabel = WEEKDAYS.find((d) => d.key === todayKey)?.label || "Today";
  const todayExercises = activeWorkout?.weeklySchedule?.[todayKey] || [];

  const daysLeft = getDaysRemaining(member?.membershipEnd);
  const todayRec = attendanceData.todayRecord;
  const isCheckedInOnly = Boolean(todayRec?.checkIn && !todayRec?.checkOut);
  const isCompletedToday = Boolean(todayRec?.checkIn && todayRec?.checkOut);

  return (
    <DashboardLayout
      title="Training Hub"
      subtitle="Your membership, today's programming, and live attendance"
    >
      {isLoading ? (
        <LoadingState label="Loading your training hub..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadDashboard} />
      ) : !member ? (
        <ErrorBanner message="Member profile not found." onRetry={loadDashboard} />
      ) : (
        <div className="space-y-6">
          {/* Hero Membership + Quick Check-In */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl"
            />
            <div className="relative space-y-2.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <StatusBadge status={member.membershipStatus} />
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-200 border border-slate-700/80">
                  {formatPlanName(member.membershipPlan)}
                </span>
                <span className="text-xs font-medium text-indigo-300">
                  Goal: {formatGoal(member.fitnessGoal)}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-white">
                Welcome back, {member.user?.name}!
              </h2>

              <p className="text-xs sm:text-sm text-slate-300">
                {member.membershipEnd ? (
                  daysLeft !== null && daysLeft >= 0 ? (
                    <>
                      Membership valid until{" "}
                      <strong className="text-white">
                        {formatDate(member.membershipEnd)}
                      </strong>{" "}
                      ({daysLeft} day{daysLeft === 1 ? "" : "s"} remaining)
                    </>
                  ) : (
                    <>
                      Membership ended on{" "}
                      <strong className="text-rose-300">
                        {formatDate(member.membershipEnd)}
                      </strong>
                    </>
                  )
                ) : (
                  "No membership end date configured yet."
                )}
              </p>
            </div>

            <div className="relative flex flex-wrap items-center gap-3 shrink-0">
              {isCompletedToday ? (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2.5">
                  <ClockIcon className="w-4 h-4 text-emerald-300" />
                  <div>
                    <p className="font-semibold">Today&apos;s session completed</p>
                    <p className="text-[11px] text-emerald-300/80">
                      {formatTime(todayRec.checkIn)} → {formatTime(todayRec.checkOut)}
                    </p>
                  </div>
                </div>
              ) : isCheckedInOnly ? (
                <button
                  type="button"
                  disabled={isCheckActionLoading}
                  onClick={handleCheckOut}
                  className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg transition inline-flex items-center gap-2"
                >
                  <ClockIcon className="w-4 h-4" />
                  {isCheckActionLoading
                    ? "Checking out..."
                    : `Check Out (In since ${formatTime(todayRec.checkIn)})`}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    isCheckActionLoading || member.membershipStatus !== "active"
                  }
                  onClick={handleCheckIn}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg transition inline-flex items-center gap-2"
                >
                  <CalendarCheckIcon className="w-4 h-4" />
                  {isCheckActionLoading
                    ? "Checking in..."
                    : member.membershipStatus === "active"
                    ? "Check In to Gym"
                    : "Active Membership Required"}
                </button>
              )}

              <Link
                to="/member/checkin"
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Attendance Log
              </Link>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Link to="/member/checkin">
              <StatCard
                label="This Month Check-Ins"
                value={attendanceData.summary?.presentDays ?? 0}
                hint={`${attendanceData.summary?.totalDays ?? 0} recorded day(s)`}
                icon={CalendarCheckIcon}
                tone="emerald"
              />
            </Link>

            <StatCard
              label="Workout Plans"
              value={workouts.length}
              hint={`${todayExercises.length} exercise(s) scheduled today`}
              icon={DumbbellIcon}
              tone="indigo"
            />
            <StatCard
              label="Calorie Target"
              value={activeDiet ? `${activeDiet.dailyCalorieTarget} kcal` : "—"}
              hint={activeDiet ? activeDiet.title : "No active diet plan"}
              icon={FlameIcon}
              tone="amber"
            />
            <StatCard
              label="Unread Alerts"
              value={unreadNotifications.length}
              hint="Updates & reminders"
              icon={BellIcon}
              tone="sky"
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Workout Preview */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {todayLabel}&apos;s Workout
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeWorkout
                      ? activeWorkout.title
                      : "No workout plan assigned yet"}
                  </p>
                </div>
                <Link
                  to="/member/workouts"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  Full schedule <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>

              {!activeWorkout ? (
                <p className="text-sm text-slate-400 py-8 text-center">
                  Your trainer hasn&apos;t assigned a workout plan yet.
                </p>
              ) : todayExercises.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
                  <p className="text-sm font-semibold text-white">
                    Rest &amp; Recovery Day
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    No exercises scheduled for {todayLabel}. Stretch, hydrate, and recover!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {todayExercises.map((ex, i) => (
                    <div
                      key={`${ex.name}-${i}`}
                      className="rounded-xl bg-slate-900/75 border border-slate-800 p-4"
                    >
                      <p className="text-sm font-semibold text-white">
                        {i + 1}. {ex.name}
                      </p>
                      <p className="text-xs font-mono text-indigo-300 mt-1">
                        {ex.sets} sets
                        {ex.reps ? ` × ${ex.reps} reps` : ""}
                        {ex.duration ? ` · ${ex.duration}s` : ""}
                      </p>
                      {ex.notes && (
                        <p className="text-xs text-slate-400 mt-1">{ex.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Coach + Diet */}
            <div className="space-y-6">
              {/* Assigned Trainer */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white">Your Coach</h3>
                {member.trainer ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={member.trainer.user?.profileImage}
                        name={member.trainer.user?.name}
                        size="lg"
                      />
                      <div>
                        <p className="text-sm font-bold text-white">
                          {member.trainer.user?.name}
                        </p>
                        <p className="text-xs text-indigo-300">
                          {formatSpecialization(member.trainer.specialization)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {member.trainer.experience ?? 0} yrs experience
                        </p>
                      </div>
                    </div>
                    {member.trainer.bio && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {member.trainer.bio}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                      {member.trainer.user?.email}
                      {member.trainer.user?.phone
                        ? ` · ${member.trainer.user.phone}`
                        : ""}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No personal trainer assigned yet. Contact your Club Admin to pair
                    with a coach.
                  </p>
                )}
              </div>

              {/* Nutrition Snapshot */}
              <div className="glass-card rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Nutrition Plan</h3>
                  <Link
                    to="/member/diets"
                    className="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                  >
                    Open →
                  </Link>
                </div>
                {activeDiet ? (
                  <div className="space-y-2 text-xs">
                    <p className="text-sm font-semibold text-white">
                      {activeDiet.title}
                    </p>
                    <p className="text-slate-300 flex items-center gap-1.5">
                      <UtensilsIcon className="w-4 h-4 text-emerald-300" />
                      Target: {activeDiet.dailyCalorieTarget} kcal ·{" "}
                      {activeDiet.dailyMeals?.length || 0} meal slot(s)
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No diet plan assigned yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MemberDashboard;
