import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import Avatar from "../../../components/ui/Avatar";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  ChevronRightIcon,
  SearchIcon,
  UsersIcon,
} from "../../../components/ui/Icons";
import memberService from "../../../services/member.service";
import {
  calculateBMI,
  formatGoal,
  formatPlanName,
  getErrorMessage,
} from "../../../utils/formatters";

const MyMembersPage = () => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await memberService.getAllMembers();
      setMembers(res?.members || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load your assigned members."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    memberService
      .getAllMembers()
      .then((res) => {
        if (!active) return;
        setMembers(res?.members || []);
        setError("");
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Failed to load your assigned members."));
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchesGoal = goalFilter === "all" || m.fitnessGoal === goalFilter;
      if (!matchesGoal) return false;
      if (!q) return true;
      return (
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q) ||
        m.fitnessGoal?.toLowerCase().includes(q)
      );
    });
  }, [members, searchQuery, goalFilter]);

  return (
    <DashboardLayout
      title="My Members"
      subtitle="Manage workout programming, diet plans, and attendance for assigned clients"
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <search className="relative flex-1 max-w-md">
            <label htmlFor="coach-member-search" className="sr-only">
              Search assigned members
            </label>
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="coach-member-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assigned clients..."
              className="input-field pl-10"
            />
          </search>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { value: "all", label: "All Goals" },
              { value: "weight_loss", label: "Weight Loss" },
              { value: "muscle_gain", label: "Muscle Gain" },
              { value: "endurance", label: "Endurance" },
              { value: "flexibility", label: "Flexibility" },
              { value: "general_fitness", label: "General" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setGoalFilter(item.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  goalFilter === item.value
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading your clients..." />
        ) : error ? (
          <ErrorBanner message={error} onRetry={fetchMembers} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No assigned members found"
            description={
              members.length === 0
                ? "You do not have any members assigned to you yet."
                : "No members match the selected filters."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((member) => {
              const bmi = calculateBMI(member.weight, member.height);
              return (
                <div
                  key={member._id}
                  className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={member.user?.profileImage}
                          name={member.user?.name}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white truncate">
                            {member.user?.name}
                          </h3>
                          <p className="text-xs text-slate-400 truncate">
                            {member.user?.email}
                          </p>
                          {member.user?.phone && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {member.user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={member.membershipStatus} />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-2.5">
                        <p className="text-slate-400">Goal</p>
                        <p className="text-white font-semibold mt-0.5">
                          {formatGoal(member.fitnessGoal)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-2.5">
                        <p className="text-slate-400">Plan</p>
                        <p className="text-white font-semibold mt-0.5">
                          {formatPlanName(member.membershipPlan)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-2.5">
                        <p className="text-slate-400">Body Stats</p>
                        <p className="text-white font-semibold mt-0.5">
                          {member.weight ? `${member.weight}kg` : "—"} ·{" "}
                          {member.height ? `${member.height}cm` : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-2.5">
                        <p className="text-slate-400">BMI</p>
                        <p className="text-indigo-300 font-semibold mt-0.5">
                          {bmi ? `${bmi.value} (${bmi.category})` : "—"}
                        </p>
                      </div>
                    </div>

                    {member.healthConditions && (
                      <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 line-clamp-2">
                        Health note: {member.healthConditions}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/trainer/members/${member._id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                  >
                    Manage Plans &amp; Progress
                    <ChevronRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyMembersPage;
