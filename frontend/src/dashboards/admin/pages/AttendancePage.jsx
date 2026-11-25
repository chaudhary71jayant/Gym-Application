import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import Avatar from "../../../components/ui/Avatar";
import StatCard from "../../../components/ui/StatCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  ActivityIcon,
  CalendarCheckIcon,
  ClockIcon,
  RefreshIcon,
  SearchIcon,
} from "../../../components/ui/Icons";
import attendanceService from "../../../services/attendance.service";
import {
  computeDurationMinutes,
  formatDuration,
  formatTime,
  getErrorMessage,
} from "../../../utils/formatters";

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await attendanceService.getTodayAttendance();
      setAttendance(data?.attendance || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load today's attendance."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    attendanceService
      .getTodayAttendance()
      .then((data) => {
        if (!active) return;
        setAttendance(data?.attendance || []);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load today's attendance."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stillInGym = useMemo(
    () => attendance.filter((a) => a.checkIn && !a.checkOut).length,
    [attendance]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return attendance.filter((record) => {
      const matchesState =
        stateFilter === "all"
          ? true
          : stateFilter === "in_gym"
          ? record.checkIn && !record.checkOut
          : Boolean(record.checkOut);
      if (!matchesState) return false;
      if (!q) return true;
      return (
        record.member?.user?.name?.toLowerCase().includes(q) ||
        record.member?.user?.email?.toLowerCase().includes(q) ||
        record.member?.user?.phone?.toLowerCase().includes(q)
      );
    });
  }, [attendance, searchQuery, stateFilter]);

  const todayDisplay = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardLayout
      title="Daily Attendance"
      subtitle={todayDisplay}
      actions={
        <button
          type="button"
          onClick={fetchAttendance}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 transition"
        >
          <RefreshIcon className="w-4 h-4" />
          Refresh
        </button>
      }
    >
      {isLoading ? (
        <LoadingState label="Loading today's attendance..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchAttendance} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Check-Ins"
              value={attendance.length}
              hint="Members checked in today"
              icon={CalendarCheckIcon}
              tone="indigo"
            />
            <StatCard
              label="Currently on Floor"
              value={stillInGym}
              hint="Active gym sessions now"
              icon={ActivityIcon}
              tone="emerald"
            />
            <StatCard
              label="Checked Out"
              value={attendance.length - stillInGym}
              hint="Completed sessions today"
              icon={ClockIcon}
              tone="sky"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <search className="relative flex-1 max-w-md">
              <label htmlFor="attendance-search" className="sr-only">
                Search checked-in members
              </label>
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="attendance-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by member name, email, or phone..."
                className="input-field pl-10"
              />
            </search>

            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: "all", label: "All" },
                { key: "in_gym", label: "In Gym Now" },
                { key: "checked_out", label: "Checked Out" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStateFilter(opt.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                    stateFilter === opt.key
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={CalendarCheckIcon}
              title="No attendance records found"
              description={
                attendance.length === 0
                  ? "No members have checked in yet today."
                  : "Try adjusting your search or filter."
              }
            />
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div
                tabIndex={0}
                role="region"
                aria-label="Today's attendance table"
                className="overflow-x-auto"
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/90 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Member
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
                    {filtered.map((record) => {
                      const durationMins = computeDurationMinutes(
                        record.checkIn,
                        record.checkOut,
                        record.sessionDuration
                      );
                      return (
                        <tr
                          key={record._id}
                          className="hover:bg-slate-800/40 transition"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={record.member?.user?.name || "U"}
                                size="sm"
                              />
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {record.member?.user?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {record.member?.user?.email || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm font-mono text-slate-200 whitespace-nowrap">
                            {formatTime(record.checkIn)}
                          </td>

                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            {record.checkOut ? (
                              <span className="font-mono text-slate-200">
                                {formatTime(record.checkOut)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                                <span
                                  aria-hidden="true"
                                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                                />
                                Still in gym
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm font-mono text-slate-300 whitespace-nowrap">
                            {formatDuration(durationMins)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={record.status} />
                          </td>
                        </tr>
                      );
                    })}
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

export default AttendancePage;
