import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import Avatar from "../../../components/ui/Avatar";
import StatusBadge from "../../../components/ui/StatusBadge";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import { ArrowLeftIcon, PlusIcon, UsersIcon } from "../../../components/ui/Icons";
import useToast from "../../../hooks/useToast";
import trainerService from "../../../services/trainer.service";
import memberService from "../../../services/member.service";
import assignmentsService from "../../../services/assignment.service";
import {
  formatGoal,
  formatPlanName,
  formatSpecialization,
  getErrorMessage,
} from "../../../utils/formatters";

const TrainerMembersPage = () => {
  const { id } = useParams();
  const { showToast } = useToast();

  const [trainer, setTrainer] = useState(null);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const [unassignTarget, setUnassignTarget] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false);

  const fetchAll = useCallback(async () => {
    const [trainerRes, membersRes, allMembersRes] = await Promise.all([
      trainerService.getTrainerById(id),
      trainerService.getAssignedMembers(id),
      memberService.getAllMembers(),
    ]);
    return {
      trainer: trainerRes?.trainer || null,
      assigned: membersRes?.members || [],
      all: allMembersRes?.members || [],
    };
  }, [id]);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAll();
      setTrainer(data.trainer);
      setAssignedMembers(data.assigned);
      setAllMembers(data.all);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load trainer roster."));
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
        setAssignedMembers(data.assigned);
        setAllMembers(data.all);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load trainer roster."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const assignableMembers = allMembers.filter(
    (m) => !assignedMembers.some((am) => am._id === m._id)
  );

  const handleAssignMember = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    setIsAssigning(true);
    try {
      await assignmentsService.assignTrainer(selectedMemberId, id);
      showToast("Member assigned to trainer!");
      setIsAssignOpen(false);
      setSelectedMemberId("");
      await fetchDetails();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to assign member."), "error");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!unassignTarget) return;
    setIsUnassigning(true);
    try {
      await assignmentsService.unassignTrainer(unassignTarget._id);
      showToast(`Unassigned ${unassignTarget.user?.name || "member"}.`);
      setUnassignTarget(null);
      await fetchDetails();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to unassign member."), "error");
    } finally {
      setIsUnassigning(false);
    }
  };

  return (
    <DashboardLayout
      title={trainer?.user?.name ? `${trainer.user.name}'s Roster` : "Trainer Roster"}
      subtitle="Manage assigned members for this coach"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/trainers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            All Trainers
          </Link>
          <button
            type="button"
            onClick={() => setIsAssignOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            <PlusIcon className="w-4 h-4" />
            Assign Member
          </button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingState label="Loading trainer roster..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchDetails} />
      ) : (
        <div className="space-y-6">
          {trainer && (
            <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    {trainer.experience ?? 0} yrs experience · {trainer.user?.email}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-400">Roster Capacity</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  {assignedMembers.length} / {trainer.maxCapacity || 30}
                </p>
              </div>
            </div>
          )}

          {assignedMembers.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No members assigned yet"
              description="Assign a gym member to this trainer to begin coaching."
              action={
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
                >
                  <PlusIcon className="w-4 h-4" />
                  Assign Member
                </button>
              }
            />
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div
                tabIndex={0}
                role="region"
                aria-label="Assigned members table"
                className="overflow-x-auto"
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/90 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Member
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Fitness Goal
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Plan
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {assignedMembers.map((member) => (
                      <tr
                        key={member._id}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={member.user?.name} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {member.user?.name || "Member"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {member.user?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-200">
                          {formatGoal(member.fitnessGoal)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {formatPlanName(member.membershipPlan)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={member.membershipStatus} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setUnassignTarget(member)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold transition"
                          >
                            Unassign
                          </button>
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

      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Member to Trainer"
        size="sm"
        closedBy={isAssigning ? "none" : "any"}
      >
        <form onSubmit={handleAssignMember} className="space-y-4">
          <div>
            <label
              htmlFor="assign-mem-select"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Choose Member <span className="text-rose-400">*</span>
            </label>
            <select
              id="assign-mem-select"
              autoFocus
              required
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="input-field"
            >
              <option value="">Select member...</option>
              {assignableMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.user?.name} ({formatGoal(m.fitnessGoal)})
                  {m.trainer ? ` — currently with ${m.trainer.user?.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isAssigning}
              onClick={() => setIsAssignOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssigning || !selectedMemberId}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              {isAssigning ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!unassignTarget}
        onClose={() => setUnassignTarget(null)}
        onConfirm={handleUnassign}
        title="Unassign Member"
        message={`Unassign ${unassignTarget?.user?.name || "this member"} from ${
          trainer?.user?.name || "this trainer"
        }?`}
        confirmLabel="Unassign"
        variant="warning"
        isLoading={isUnassigning}
      />
    </DashboardLayout>
  );
};

export default TrainerMembersPage;
