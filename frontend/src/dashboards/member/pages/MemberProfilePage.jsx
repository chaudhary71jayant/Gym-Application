import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import ProfileSettings from "../../../components/ui/ProfileSettings";
import StatusBadge from "../../../components/ui/StatusBadge";
import useToast from "../../../hooks/useToast";
import memberService from "../../../services/member.service";
import { FITNESS_GOALS } from "../../../utils/constants";
import {
  calculateBMI,
  formatDate,
  formatPlanName,
  formatSpecialization,
  getErrorMessage,
} from "../../../utils/formatters";
import { ActivityIcon } from "../../../components/ui/Icons";

const MemberProfile = () => {
  const { showToast } = useToast();

  const [member, setMember] = useState(null);
  const [form, setForm] = useState({
    fitnessGoal: "general_fitness",
    age: "",
    weight: "",
    height: "",
    healthConditions: "",
  });
  const [isLoadingMember, setIsLoadingMember] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    memberService
      .getMyMemberProfile()
      .then((res) => {
        if (!active || !res?.member) return;
        const m = res.member;
        setMember(m);
        setForm({
          fitnessGoal: m.fitnessGoal || "general_fitness",
          age: m.age ?? "",
          weight: m.weight ?? "",
          height: m.height ?? "",
          healthConditions: m.healthConditions || "",
        });
      })
      .catch(() => {
        // Ignore silent failure
      })
      .finally(() => {
        if (active) setIsLoadingMember(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSaveMetrics = async (e) => {
    e.preventDefault();
    if (!member) return;

    setIsSaving(true);
    try {
      const payload = {
        fitnessGoal: form.fitnessGoal,
        healthConditions: form.healthConditions.trim(),
      };
      if (form.age !== "") payload.age = Number(form.age);
      if (form.weight !== "") payload.weight = Number(form.weight);
      if (form.height !== "") payload.height = Number(form.height);

      const res = await memberService.updateMember(member._id, payload);
      if (res?.member) {
        setMember((prev) => ({ ...prev, ...res.member }));
      }
      showToast("Fitness profile updated!");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update fitness metrics."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const liveBMI = calculateBMI(form.weight, form.height);

  return (
    <DashboardLayout
      title="Profile & Fitness Metrics"
      subtitle="Update your account, password, and personal health parameters"
    >
      <ProfileSettings>
        {/* Fitness & Body Metrics */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-300">
                <ActivityIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Fitness &amp; Body Metrics
                </h3>
                <p className="text-xs text-slate-400">
                  Helps your coach customize workout &amp; macro targets
                </p>
              </div>
            </div>
            {liveBMI && (
              <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-200 text-xs font-semibold tabular-nums">
                BMI: {liveBMI.value} ({liveBMI.category})
              </span>
            )}
          </div>

          {isLoadingMember ? (
            <p className="text-xs text-slate-400">Loading fitness profile...</p>
          ) : !member ? (
            <p className="text-xs text-slate-400">
              Member record unavailable. Contact your Club Admin.
            </p>
          ) : (
            <form onSubmit={handleSaveMetrics} className="space-y-4">
              <div>
                <label
                  htmlFor="mem-prof-goal"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Primary Fitness Goal
                </label>
                <select
                  id="mem-prof-goal"
                  value={form.fitnessGoal}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fitnessGoal: e.target.value }))
                  }
                  className="input-field"
                >
                  {FITNESS_GOALS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label
                    htmlFor="mem-prof-age"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Age (yrs)
                  </label>
                  <input
                    id="mem-prof-age"
                    type="number"
                    min="10"
                    max="120"
                    value={form.age}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, age: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mem-prof-weight"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Weight (kg)
                  </label>
                  <input
                    id="mem-prof-weight"
                    type="number"
                    step="0.1"
                    min="20"
                    value={form.weight}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, weight: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mem-prof-height"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Height (cm)
                  </label>
                  <input
                    id="mem-prof-height"
                    type="number"
                    step="0.1"
                    min="80"
                    value={form.height}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, height: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="mem-prof-health"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Health Conditions / Injuries
                </label>
                <textarea
                  id="mem-prof-health"
                  rows={2}
                  value={form.healthConditions}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, healthConditions: e.target.value }))
                  }
                  placeholder="Optional notes for your trainer..."
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition"
              >
                {isSaving ? "Saving..." : "Save Fitness Profile"}
              </button>
            </form>
          )}
        </div>

        {/* Membership & Assigned Coach Summary */}
        {member && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                Club Membership Summary
              </h3>
              <StatusBadge status={member.membershipStatus} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <p className="text-slate-400">Current Plan</p>
                <p className="text-white font-semibold mt-0.5">
                  {formatPlanName(member.membershipPlan)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <p className="text-slate-400">Valid Through</p>
                <p className="text-white font-semibold mt-0.5">
                  {formatDate(member.membershipEnd)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-xs">
              <p className="text-slate-400">Assigned Trainer</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {member.trainer
                  ? `${member.trainer.user?.name} (${formatSpecialization(
                      member.trainer.specialization
                    )})`
                  : "Not assigned yet"}
              </p>
            </div>
          </div>
        )}
      </ProfileSettings>
    </DashboardLayout>
  );
};

export default MemberProfile;
