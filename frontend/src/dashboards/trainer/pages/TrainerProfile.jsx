import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import ProfileSettings from "../../../components/ui/ProfileSettings";
import StatusBadge from "../../../components/ui/StatusBadge";
import useAuth from "../../../hooks/useAuth";
import useToast from "../../../hooks/useToast";
import trainerService from "../../../services/trainer.service";
import { TRAINER_SPECIALIZATIONS } from "../../../utils/constants";
import { getErrorMessage } from "../../../utils/formatters";
import { DumbbellIcon } from "../../../components/ui/Icons";

const TrainerProfile = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [trainer, setTrainer] = useState(null);
  const [form, setForm] = useState({
    specialization: "weight_training",
    experience: "0",
    bio: "",
    isAvailable: true,
  });
  const [isLoadingTrainer, setIsLoadingTrainer] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    trainerService
      .getAllTrainers()
      .then((res) => {
        if (!active) return;
        const me = (res?.trainers || []).find(
          (t) =>
            t.user?._id === user?.id ||
            t.user?.id === user?.id ||
            t.user?.email === user?.email
        );
        if (me) {
          setTrainer(me);
          setForm({
            specialization: me.specialization || "weight_training",
            experience: String(me.experience ?? 0),
            bio: me.bio || "",
            isAvailable: Boolean(me.isAvailable),
          });
        }
      })
      .catch(() => {
        // Silent fallback if trainer doc unavailable
      })
      .finally(() => {
        if (active) setIsLoadingTrainer(false);
      });

    return () => {
      active = false;
    };
  }, [user?.email, user?.id]);

  const handleSaveCoaching = async (e) => {
    e.preventDefault();
    if (!trainer) return;
    setIsSaving(true);
    try {
      const res = await trainerService.updateTrainer(trainer._id, {
        specialization: form.specialization,
        experience: Number(form.experience || 0),
        bio: form.bio.trim(),
        isAvailable: form.isAvailable,
      });
      if (res?.trainer) {
        setTrainer((prev) => ({ ...prev, ...res.trainer }));
      }
      showToast("Coaching profile updated!");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update coaching profile."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Coach Profile & Security"
      subtitle="Manage your personal details, specialization, and availability"
    >
      <ProfileSettings>
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300">
                <DumbbellIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Coaching Specialization
                </h3>
                <p className="text-xs text-slate-400">
                  Shown to admins and assigned members
                </p>
              </div>
            </div>
            {trainer && (
              <StatusBadge
                status={form.isAvailable ? "available" : "unavailable"}
              />
            )}
          </div>

          {isLoadingTrainer ? (
            <p className="text-xs text-slate-400">Loading coaching details...</p>
          ) : !trainer ? (
            <p className="text-xs text-slate-400">
              Trainer record not found. Contact your Club Admin.
            </p>
          ) : (
            <form onSubmit={handleSaveCoaching} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="coach-spec"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Primary Specialization
                  </label>
                  <select
                    id="coach-spec"
                    value={form.specialization}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, specialization: e.target.value }))
                    }
                    className="input-field"
                  >
                    {TRAINER_SPECIALIZATIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="coach-exp"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Experience (Years)
                  </label>
                  <input
                    id="coach-exp"
                    type="number"
                    min="0"
                    value={form.experience}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, experience: e.target.value }))
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="coach-bio"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Bio &amp; Credentials
                </label>
                <textarea
                  id="coach-bio"
                  rows={3}
                  maxLength={500}
                  value={form.bio}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="Share your coaching background and training focus..."
                  className="input-field"
                />
              </div>

              <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">
                    Accepting New Members
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Current capacity: {trainer.assignedMembers?.length || 0} /{" "}
                    {trainer.maxCapacity || 30}
                  </p>
                </div>
                <input
                  id="coach-avail"
                  aria-label="Accepting new members"
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isAvailable: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition"
              >
                {isSaving ? "Saving..." : "Save Coaching Profile"}
              </button>
            </form>
          )}
        </div>
      </ProfileSettings>
    </DashboardLayout>
  );
};

export default TrainerProfile;
