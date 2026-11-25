import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import StatCard from "../../../components/ui/StatCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  ActivityIcon,
  CalendarCheckIcon,
  ClockIcon,
} from "../../../components/ui/Icons";
import useToast from "../../../hooks/useToast";
import memberService from "../../../services/member.service";
import attendanceService from "../../../services/attendance.service";
import {
  computeDurationMinutes,
  formatDate,
  formatDuration,
  formatElapsedClock,
  formatTime,
  getErrorMessage,
} from "../../../utils/formatters";

const isSameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const CheckInPage = () => {
  const { showToast } = useToast();

  const [member, setMember] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);

  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    const profileRes = await memberService.getMyMemberProfile();
    const me = profileRes?.member || null;
    if (!me?._id) {
      return { member: null, summary: null, records: [], todayRecord: null };
    }

    const now = new Date();
    const isCurrentMonth =
      Number(month) === now.getMonth() + 1 && Number(year) === now.getFullYear();

    const [selectedRes, currentMonthRes] = await Promise.all([
      attendanceService.getMemberAttendance(me._id, month, year),
      isCurrentMonth
        ? Promise.resolve(null)
        : attendanceService.getMemberAttendance(
            me._id,
            now.getMonth() + 1,
            now.getFullYear()
          ),
    ]);

    const currentRecords = isCurrentMonth
      ? selectedRes?.attendance || []
      : currentMonthRes?.attendance || [];
    const todayRec =
      currentRecords.find((r) => isSameDay(r.date || r.checkIn, now)) || null;

    return {
      member: me,
      summary: selectedRes?.summary || null,
      records: selectedRes?.attendance || [],
      todayRecord: todayRec,
    };
  }, [month, year]);

  const loadAttendance = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAll();
      setMember(data.member);
      setSummary(data.summary);
      setRecords(data.records);
      setTodayRecord(data.todayRecord);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load attendance history."));
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
        setSummary(data.summary);
        setRecords(data.records);
        setTodayRecord(data.todayRecord);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load attendance history."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const isInGym = Boolean(todayRecord?.checkIn && !todayRecord?.checkOut);

  useEffect(() => {
    if (!isInGym) return undefined;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isInGym]);

  const handleCheckIn = async () => {
    setIsActionLoading(true);
    try {
      await attendanceService.checkIn();
      showToast("Checked in! Let's get after it.");
      await loadAttendance();
    } catch (err) {
      showToast(getErrorMessage(err, "Check-in failed."), "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsActionLoading(true);
    try {
      const res = await attendanceService.checkOut();
      showToast(
        res?.sessionDuration
          ? `Checked out! Workout duration: ${res.sessionDuration} min.`
          : "Checked out successfully!"
      );
      await loadAttendance();
    } catch (err) {
      showToast(getErrorMessage(err, "Check-out failed."), "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const isCompletedToday = Boolean(todayRecord?.checkIn && todayRecord?.checkOut);

  return (
    <DashboardLayout
      title="Check In / Check Out"
      subtitle="Log your daily gym visit and review your monthly attendance streak"
    >
      {isLoading ? (
        <LoadingState label="Loading attendance console..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadAttendance} />
      ) : (
        <div className="space-y-6">
          {/* Live Session Console */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Today&apos;s Session
              </p>

              {isInGym ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                    {formatElapsedClock(todayRecord.checkIn, nowMs)}
                  </h2>
                  <p className="text-sm text-emerald-300">
                    Active session · Checked in at {formatTime(todayRecord.checkIn)}
                  </p>
                </>
              ) : isCompletedToday ? (
                <>
                  <h2 className="text-2xl font-extrabold text-white">
                    Session Complete —{" "}
                    {formatDuration(
                      computeDurationMinutes(
                        todayRecord.checkIn,
                        todayRecord.checkOut,
                        todayRecord.sessionDuration
                      )
                    )}
                  </h2>
                  <p className="text-sm text-slate-300">
                    Checked in at {formatTime(todayRecord.checkIn)} · Checked out at{" "}
                    {formatTime(todayRecord.checkOut)}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-extrabold text-white">
                    Ready to train today?
                  </h2>
                  <p className="text-sm text-slate-300">
                    {member?.membershipStatus === "active"
                      ? "Tap Check In when you enter the gym floor."
                      : "Your membership status must be Active to check in."}
                  </p>
                </>
              )}
            </div>

            <div className="shrink-0">
              {isCompletedToday ? (
                <StatusBadge status="present" label="Completed Today" />
              ) : isInGym ? (
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleCheckOut}
                  className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg transition inline-flex items-center gap-2"
                >
                  <ClockIcon className="w-5 h-5" />
                  {isActionLoading ? "Checking Out..." : "Check Out Now"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    isActionLoading || member?.membershipStatus !== "active"
                  }
                  onClick={handleCheckIn}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg transition inline-flex items-center gap-2"
                >
                  <CalendarCheckIcon className="w-5 h-5" />
                  {isActionLoading ? "Checking In..." : "Check In Now"}
                </button>
              )}
            </div>
          </div>

          {/* Monthly Summary */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Logs"
                value={summary.totalDays}
                icon={CalendarCheckIcon}
                tone="indigo"
              />
              <StatCard
                label="Present"
                value={summary.presentDays}
                icon={ActivityIcon}
                tone="emerald"
              />
              <StatCard
                label="Late"
                value={summary.lateDays}
                icon={ClockIcon}
                tone="amber"
              />
              <StatCard
                label="Absent"
                value={summary.absentDays}
                icon={CalendarCheckIcon}
                tone="rose"
              />
            </div>
          )}

          {/* Month Filter + History Table */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white">Attendance History</h3>
            <div className="flex items-center gap-3">
              <label htmlFor="member-att-month" className="sr-only">
                Month
              </label>
              <select
                id="member-att-month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="input-field w-auto"
              >
                {Array.from({ length: 12 }, (_, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    {new Date(2026, idx, 1).toLocaleString("en-US", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>

              <label htmlFor="member-att-year" className="sr-only">
                Year
              </label>
              <select
                id="member-att-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="input-field w-auto"
              >
                {[2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {records.length === 0 ? (
            <EmptyState
              icon={CalendarCheckIcon}
              title="No attendance records for this month"
              description="Your check-in and check-out logs will appear here."
            />
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div
                tabIndex={0}
                role="region"
                aria-label="Attendance records table"
                className="overflow-x-auto"
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/90 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Date
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Check In
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Check Out
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Duration
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {records.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-800/40">
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {formatDate(rec.date)}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-200">
                          {formatTime(rec.checkIn)}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-200">
                          {rec.checkOut ? formatTime(rec.checkOut) : "In progress"}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-300">
                          {formatDuration(
                            computeDurationMinutes(
                              rec.checkIn,
                              rec.checkOut,
                              rec.sessionDuration
                            )
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={rec.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CheckInPage;
