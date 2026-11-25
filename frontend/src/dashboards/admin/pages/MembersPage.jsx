import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import Avatar from "../../../components/ui/Avatar";
import StatusBadge from "../../../components/ui/StatusBadge";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  DumbbellIcon,
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
} from "../../../components/ui/Icons";
import useToast from "../../../hooks/useToast";
import memberService from "../../../services/member.service";
import trainerService from "../../../services/trainer.service";
import assignmentsService from "../../../services/assignment.service";
import authService from "../../../services/auth.service";
import userService from "../../../services/user.service";
import attendanceService from "../../../services/attendance.service";
import paymentService from "../../../services/payment.service";
import {
  FITNESS_GOALS,
  MEMBERSHIP_PLANS,
  MEMBERSHIP_STATUSES,
} from "../../../utils/constants";
import {
  calculateBMI,
  computePlanEndDate,
  formatCurrency,
  formatDate,
  formatGoal,
  formatPlanName,
  formatSpecialization,
  getErrorMessage,
} from "../../../utils/formatters";

const createInitialRegisterForm = () => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: "",
    email: "",
    phone: "",
    password: "",
    fitnessGoal: "general_fitness",
    membershipPlan: "monthly",
    membershipStart: today,
    membershipEnd: computePlanEndDate(today, "monthly"),
  };
};

const MembersPage = () => {
  const { showToast } = useToast();

  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Member modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(createInitialRegisterForm);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Member modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Assign Trainer modal
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Inspect Member modal
  const [inspectTarget, setInspectTarget] = useState(null);
  const [inspectExtra, setInspectExtra] = useState({
    loading: false,
    attendanceSummary: null,
    payments: [],
  });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  const fetchAll = useCallback(async () => {
    const [membersRes, trainersRes] = await Promise.all([
      memberService.getAllMembers(),
      trainerService.getAllTrainers(),
    ]);
    return {
      members: membersRes?.members || [],
      trainers: trainersRes?.trainers || [],
    };
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAll();
      setMembers(data.members);
      setTrainers(data.trainers);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load members."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((data) => {
        if (!active) return;
        setMembers(data.members);
        setTrainers(data.trainers);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load members."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchesStatus =
        statusFilter === "all" || m.membershipStatus === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q) ||
        m.user?.phone?.toLowerCase().includes(q) ||
        m.trainer?.user?.name?.toLowerCase().includes(q)
      );
    });
  }, [members, searchQuery, statusFilter]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      showToast("Name, email, and password are required.", "error");
      return;
    }
    if (addForm.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setIsCreating(true);
    try {
      await authService.register({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        password: addForm.password,
        fitnessGoal: addForm.fitnessGoal,
        membershipPlan: addForm.membershipPlan,
        membershipStart: addForm.membershipStart || undefined,
        membershipEnd: addForm.membershipEnd || undefined,
      });
      showToast(`Member ${addForm.name} registered successfully!`);
      setIsAddOpen(false);
      setAddForm(createInitialRegisterForm());
      await fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to register member."), "error");
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (member) => {
    setEditTarget(member);
    setEditForm({
      fitnessGoal: member.fitnessGoal || "general_fitness",
      age: member.age ?? "",
      weight: member.weight ?? "",
      height: member.height ?? "",
      healthConditions: member.healthConditions || "",
      membershipPlan: member.membershipPlan || "monthly",
      membershipStatus: member.membershipStatus || "active",
      membershipStart: member.membershipStart
        ? new Date(member.membershipStart).toISOString().slice(0, 10)
        : "",
      membershipEnd: member.membershipEnd
        ? new Date(member.membershipEnd).toISOString().slice(0, 10)
        : "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    setIsSavingEdit(true);
    try {
      const payload = {
        fitnessGoal: editForm.fitnessGoal,
        healthConditions: editForm.healthConditions,
        membershipPlan: editForm.membershipPlan || null,
        membershipStatus: editForm.membershipStatus,
        membershipStart: editForm.membershipStart || null,
        membershipEnd: editForm.membershipEnd || null,
      };
      if (editForm.age !== "") payload.age = Number(editForm.age);
      if (editForm.weight !== "") payload.weight = Number(editForm.weight);
      if (editForm.height !== "") payload.height = Number(editForm.height);

      await memberService.updateMember(editTarget._id, payload);
      showToast(`Updated ${editTarget.user?.name || "member"}'s profile.`);
      setEditTarget(null);
      await fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update member."), "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openAssignModal = (member) => {
    setAssignTarget(member);
    setSelectedTrainerId(member.trainer?._id || "");
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignTarget || !selectedTrainerId) {
      showToast("Please select a trainer.", "error");
      return;
    }

    setIsAssigning(true);
    try {
      await assignmentsService.assignTrainer(assignTarget._id, selectedTrainerId);
      showToast("Trainer assigned successfully!");
      setAssignTarget(null);
      await fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to assign trainer."), "error");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!assignTarget) return;
    setIsAssigning(true);
    try {
      await assignmentsService.unassignTrainer(assignTarget._id);
      showToast("Trainer unassigned.");
      setAssignTarget(null);
      await fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to unassign trainer."), "error");
    } finally {
      setIsAssigning(false);
    }
  };

  const openInspectModal = async (member) => {
    setInspectTarget(member);
    setInspectExtra({ loading: true, attendanceSummary: null, payments: [] });
    try {
      const [attRes, payRes] = await Promise.all([
        attendanceService.getMemberAttendance(member._id),
        paymentService.getMemberPayments(member._id),
      ]);
      setInspectExtra({
        loading: false,
        attendanceSummary: attRes?.summary || null,
        payments: payRes?.payments || [],
      });
    } catch {
      setInspectExtra({ loading: false, attendanceSummary: null, payments: [] });
    }
  };

  const handleToggleUserStatus = async (member) => {
    const userId = member.user?._id;
    if (!userId) return;
    const nextActive = member.user?.isActive === false;
    setTogglingUserId(userId);
    try {
      await userService.updateUserStatus(userId, nextActive);
      setMembers((prev) =>
        prev.map((m) =>
          m._id === member._id
            ? { ...m, user: { ...m.user, isActive: nextActive } }
            : m
        )
      );
      showToast(
        `${member.user?.name}'s login account ${
          nextActive ? "activated" : "deactivated"
        }.`
      );
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update account status."), "error");
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await memberService.deleteMember(deleteTarget._id);
      setMembers((prev) => prev.filter((m) => m._id !== deleteTarget._id));
      showToast(`Deleted member ${deleteTarget.user?.name || ""}.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete member."), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const inspectBMI = inspectTarget
    ? calculateBMI(inspectTarget.weight, inspectTarget.height)
    : null;

  return (
    <DashboardLayout
      title="Member Directory"
      subtitle="Register members, manage memberships, and assign coaches"
      actions={
        <button
          type="button"
          onClick={() => {
            setAddForm(createInitialRegisterForm());
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-950/50 transition"
        >
          <UserPlusIcon className="w-4 h-4" />
          Register Member
        </button>
      }
    >
      <div className="space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <search className="relative flex-1 max-w-md">
            <label htmlFor="member-search" className="sr-only">
              Search members
            </label>
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="member-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, or trainer..."
              className="input-field pl-10"
            />
          </search>

          <div className="flex items-center gap-2 flex-wrap">
            {[{ value: "all", label: "All" }, ...MEMBERSHIP_STATUSES].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatusFilter(item.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                  statusFilter === item.value
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
          <LoadingState label="Loading members..." />
        ) : error ? (
          <ErrorBanner message={error} onRetry={fetchData} />
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No members match your criteria"
            description="Register a new member or clear your active filters."
            action={
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
              >
                <PlusIcon className="w-4 h-4" />
                Register Member
              </button>
            }
          />
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div
              tabIndex={0}
              role="region"
              aria-label="Members directory table"
              className="overflow-x-auto"
            >
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/90 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Member
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Goal &amp; Plan
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Membership
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Trainer
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Account
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredMembers.map((member) => {
                    const isUserActive = member.user?.isActive !== false;
                    return (
                      <tr
                        key={member._id}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={member.user?.profileImage}
                              name={member.user?.name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => openInspectModal(member)}
                                className="text-sm font-semibold text-white hover:text-indigo-300 transition text-left"
                              >
                                {member.user?.name || "Member"}
                              </button>
                              <p className="text-xs text-slate-400 truncate">
                                {member.user?.email}
                              </p>
                              {member.user?.phone && (
                                <p className="text-[11px] text-slate-500">
                                  {member.user.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs whitespace-nowrap">
                          <p className="text-white font-medium">
                            {formatGoal(member.fitnessGoal)}
                          </p>
                          <p className="text-slate-400 mt-0.5">
                            {formatPlanName(member.membershipPlan)}
                          </p>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={member.membershipStatus} />
                          <p className="text-[11px] text-slate-400 mt-1">
                            Ends: {formatDate(member.membershipEnd)}
                          </p>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          {member.trainer ? (
                            <div>
                              <p className="text-xs font-semibold text-white">
                                {member.trainer.user?.name || "Assigned"}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {formatSpecialization(member.trainer.specialization)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Unassigned</span>
                          )}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            disabled={togglingUserId === member.user?._id}
                            onClick={() => handleToggleUserStatus(member)}
                            title="Toggle login access"
                            className="disabled:opacity-50"
                          >
                            <StatusBadge
                              status={isUserActive ? "active" : "inactive"}
                            />
                          </button>
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openAssignModal(member)}
                              title="Assign or change trainer"
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition inline-flex items-center gap-1"
                            >
                              <DumbbellIcon className="w-3.5 h-3.5" />
                              {member.trainer ? "Reassign" : "Assign"}
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(member)}
                              aria-label={`Edit ${member.user?.name}`}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(member)}
                              aria-label={`Delete ${member.user?.name}`}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Register Member Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Member"
        subtitle="Creates both login credentials and gym member profile."
        closedBy={isCreating ? "none" : "any"}
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="add-mem-name"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="add-mem-name"
                type="text"
                autoFocus
                required
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Alex Morgan"
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="add-mem-phone"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Phone Number
              </label>
              <input
                id="add-mem-phone"
                type="tel"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+91 98765 43210"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="add-mem-email"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                id="add-mem-email"
                type="email"
                spellCheck={false}
                required
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="member@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="add-mem-pass"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="add-mem-pass"
                  type={showAddPassword ? "text" : "password"}
                  minLength={6}
                  required
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Min 6 characters"
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  aria-pressed={showAddPassword}
                  aria-label={showAddPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowAddPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showAddPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="add-mem-goal"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Fitness Goal <span className="text-rose-400">*</span>
              </label>
              <select
                id="add-mem-goal"
                required
                value={addForm.fitnessGoal}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, fitnessGoal: e.target.value }))
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

            <div>
              <label
                htmlFor="add-mem-plan"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Membership Plan
              </label>
              <select
                id="add-mem-plan"
                value={addForm.membershipPlan}
                onChange={(e) => {
                  const plan = e.target.value;
                  setAddForm((p) => ({
                    ...p,
                    membershipPlan: plan,
                    membershipEnd: computePlanEndDate(p.membershipStart, plan),
                  }));
                }}
                className="input-field"
              >
                {MEMBERSHIP_PLANS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="add-mem-start"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Start Date
              </label>
              <input
                id="add-mem-start"
                type="date"
                value={addForm.membershipStart}
                onChange={(e) => {
                  const start = e.target.value;
                  setAddForm((p) => ({
                    ...p,
                    membershipStart: start,
                    membershipEnd: computePlanEndDate(start, p.membershipPlan),
                  }));
                }}
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="add-mem-end"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                End Date
              </label>
              <input
                id="add-mem-end"
                type="date"
                value={addForm.membershipEnd}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, membershipEnd: e.target.value }))
                }
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isCreating}
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              {isCreating ? "Registering..." : "Register Member"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit Member — ${editTarget?.user?.name || ""}`}
        subtitle="Update fitness goal, biometrics, and membership schedule."
        closedBy={isSavingEdit ? "none" : "any"}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-mem-goal"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Fitness Goal
              </label>
              <select
                id="edit-mem-goal"
                value={editForm.fitnessGoal || "general_fitness"}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, fitnessGoal: e.target.value }))
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

            <div>
              <label
                htmlFor="edit-mem-status"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Membership Status
              </label>
              <select
                id="edit-mem-status"
                value={editForm.membershipStatus || "active"}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, membershipStatus: e.target.value }))
                }
                className="input-field"
              >
                {MEMBERSHIP_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="edit-mem-age"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Age
              </label>
              <input
                id="edit-mem-age"
                type="number"
                min="10"
                max="120"
                value={editForm.age ?? ""}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, age: e.target.value }))
                }
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="edit-mem-weight"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Weight (kg)
              </label>
              <input
                id="edit-mem-weight"
                type="number"
                step="0.1"
                min="20"
                value={editForm.weight ?? ""}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, weight: e.target.value }))
                }
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="edit-mem-height"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Height (cm)
              </label>
              <input
                id="edit-mem-height"
                type="number"
                step="0.1"
                min="80"
                value={editForm.height ?? ""}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, height: e.target.value }))
                }
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="edit-mem-plan"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Plan
              </label>
              <select
                id="edit-mem-plan"
                value={editForm.membershipPlan || "monthly"}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, membershipPlan: e.target.value }))
                }
                className="input-field"
              >
                {MEMBERSHIP_PLANS.map((pl) => (
                  <option key={pl.value} value={pl.value}>
                    {pl.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-mem-start"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Start Date
              </label>
              <input
                id="edit-mem-start"
                type="date"
                value={editForm.membershipStart || ""}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, membershipStart: e.target.value }))
                }
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="edit-mem-end"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                End Date
              </label>
              <input
                id="edit-mem-end"
                type="date"
                value={editForm.membershipEnd || ""}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, membershipEnd: e.target.value }))
                }
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-mem-health"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Health Conditions / Notes
            </label>
            <textarea
              id="edit-mem-health"
              rows={2}
              value={editForm.healthConditions || ""}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, healthConditions: e.target.value }))
              }
              placeholder="Any injuries, allergies, or medical considerations..."
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSavingEdit}
              onClick={() => setEditTarget(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Trainer Modal */}
      <Modal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={`Assign Coach — ${assignTarget?.user?.name || ""}`}
        subtitle={`Fitness Goal: ${formatGoal(assignTarget?.fitnessGoal)}`}
        size="sm"
        closedBy={isAssigning ? "none" : "any"}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="assign-trainer-select"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Select Trainer <span className="text-rose-400">*</span>
            </label>
            <select
              id="assign-trainer-select"
              autoFocus
              required
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a trainer...</option>
              {trainers.map((t) => {
                const load = t.assignedMembers?.length || 0;
                const max = t.maxCapacity || 30;
                const disabled = !t.isAvailable || (load >= max && t._id !== assignTarget?.trainer?._id);
                return (
                  <option key={t._id} value={t._id} disabled={disabled}>
                    {t.user?.name} — {formatSpecialization(t.specialization)} ({load}/{max})
                    {!t.isAvailable ? " [Unavailable]" : load >= max ? " [Full]" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            {assignTarget?.trainer ? (
              <button
                type="button"
                disabled={isAssigning}
                onClick={handleUnassign}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
              >
                Unassign Current
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isAssigning}
                onClick={() => setAssignTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAssigning || !selectedTrainerId}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition"
              >
                {isAssigning ? "Assigning..." : "Assign Trainer"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Member Inspector Modal */}
      <Modal
        isOpen={!!inspectTarget}
        onClose={() => setInspectTarget(null)}
        title={inspectTarget?.user?.name || "Member Details"}
        subtitle={inspectTarget?.user?.email}
        size="lg"
      >
        {inspectTarget && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
                <p className="text-[11px] text-slate-400">Status</p>
                <div className="mt-1">
                  <StatusBadge status={inspectTarget.membershipStatus} />
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
                <p className="text-[11px] text-slate-400">Goal</p>
                <p className="text-sm font-semibold text-white mt-1">
                  {formatGoal(inspectTarget.fitnessGoal)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
                <p className="text-[11px] text-slate-400">Metrics</p>
                <p className="text-sm font-semibold text-white mt-1">
                  {inspectTarget.weight ? `${inspectTarget.weight} kg` : "—"} ·{" "}
                  {inspectTarget.height ? `${inspectTarget.height} cm` : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
                <p className="text-[11px] text-slate-400">BMI</p>
                <p className="text-sm font-semibold text-indigo-300 mt-1">
                  {inspectBMI ? `${inspectBMI.value} (${inspectBMI.category})` : "—"}
                </p>
              </div>
            </div>

            {inspectTarget.healthConditions && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5">
                <p className="text-xs font-semibold text-amber-300">
                  Health Notes
                </p>
                <p className="text-xs text-slate-200 mt-1">
                  {inspectTarget.healthConditions}
                </p>
              </div>
            )}

            {inspectExtra.loading ? (
              <LoadingState label="Loading member history..." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Attendance Summary
                  </h4>
                  {inspectExtra.attendanceSummary ? (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <p className="text-slate-300">
                        Total Days:{" "}
                        <span className="font-bold text-white">
                          {inspectExtra.attendanceSummary.totalDays}
                        </span>
                      </p>
                      <p className="text-emerald-300">
                        Present:{" "}
                        <span className="font-bold">
                          {inspectExtra.attendanceSummary.presentDays}
                        </span>
                      </p>
                      <p className="text-amber-300">
                        Late:{" "}
                        <span className="font-bold">
                          {inspectExtra.attendanceSummary.lateDays}
                        </span>
                      </p>
                      <p className="text-rose-300">
                        Absent:{" "}
                        <span className="font-bold">
                          {inspectExtra.attendanceSummary.absentDays}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No attendance history.</p>
                  )}
                </div>

                <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Recent Payments ({inspectExtra.payments.length})
                  </h4>
                  {inspectExtra.payments.length === 0 ? (
                    <p className="text-xs text-slate-500">No payment records.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {inspectExtra.payments.slice(0, 3).map((p) => (
                        <div
                          key={p._id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-300">
                            {formatPlanName(p.membershipPlan)} ({formatDate(p.createdAt)})
                          </span>
                          <span className="font-semibold text-emerald-300">
                            {formatCurrency(p.amount)} · {p.paymentStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteMember}
        title="Delete Member"
        message={`Permanently delete "${deleteTarget?.user?.name}" and their member profile? This cannot be undone.`}
        confirmLabel="Delete Member"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
};

export default MembersPage;
