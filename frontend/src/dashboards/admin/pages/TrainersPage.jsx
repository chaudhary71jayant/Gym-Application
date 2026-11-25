import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  UsersIcon,
} from "../../../components/ui/Icons";
import useToast from "../../../hooks/useToast";
import trainerService from "../../../services/trainer.service";
import { TRAINER_SPECIALIZATIONS } from "../../../utils/constants";
import { formatSpecialization, getErrorMessage } from "../../../utils/formatters";

const INITIAL_CREATE_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  specialization: "weight_training",
  experience: "2",
  maxCapacity: "30",
  bio: "",
};

const TrainersPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  // Create Trainer
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Trainer
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Trainer
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTrainers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await trainerService.getAllTrainers();
      setTrainers(data?.trainers || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load trainers. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    trainerService
      .getAllTrainers()
      .then((data) => {
        if (!active) return;
        setTrainers(data?.trainers || []);
        setError("");
      })
      .catch((err) => {
        if (active) {
          setError(
            getErrorMessage(err, "Failed to load trainers. Please try again.")
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredTrainers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return trainers.filter((t) => {
      const matchesAvail =
        availabilityFilter === "all"
          ? true
          : availabilityFilter === "available"
          ? t.isAvailable
          : !t.isAvailable;
      if (!matchesAvail) return false;
      if (!q) return true;
      return (
        t.user?.name?.toLowerCase().includes(q) ||
        t.user?.email?.toLowerCase().includes(q) ||
        t.specialization?.toLowerCase().includes(q)
      );
    });
  }, [trainers, searchQuery, availabilityFilter]);

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      showToast("Name, email, and password are required.", "error");
      return;
    }
    if (createForm.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setIsCreating(true);
    try {
      await trainerService.createTrainer({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password,
        specialization: createForm.specialization,
        experience: Number(createForm.experience || 0),
        maxCapacity: Number(createForm.maxCapacity || 30),
        bio: createForm.bio.trim(),
      });
      showToast(`Trainer ${createForm.name} added to the coaching roster!`);
      setIsCreateOpen(false);
      setCreateForm(INITIAL_CREATE_FORM);
      await fetchTrainers();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to create trainer."), "error");
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (trainer) => {
    setEditTarget(trainer);
    setEditForm({
      specialization: trainer.specialization || "weight_training",
      experience: String(trainer.experience ?? 0),
      maxCapacity: String(trainer.maxCapacity ?? 30),
      bio: trainer.bio || "",
      isAvailable: Boolean(trainer.isAvailable),
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsSavingEdit(true);
    try {
      await trainerService.updateTrainer(editTarget._id, {
        specialization: editForm.specialization,
        experience: Number(editForm.experience || 0),
        maxCapacity: Number(editForm.maxCapacity || 30),
        bio: editForm.bio.trim(),
        isAvailable: editForm.isAvailable,
      });
      showToast(`Updated ${editTarget.user?.name || "trainer"}'s profile.`);
      setEditTarget(null);
      await fetchTrainers();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update trainer."), "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await trainerService.deleteTrainer(deleteTarget._id);
      setTrainers((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      showToast(`Removed trainer ${deleteTarget.user?.name || ""}.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete trainer."), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout
      title="Coaching Roster"
      subtitle="Add trainers, manage specializations, and balance member capacity"
      actions={
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-950/50 transition"
        >
          <PlusIcon className="w-4 h-4" />
          Add Trainer
        </button>
      }
    >
      <div className="space-y-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <search className="relative flex-1 max-w-md">
            <label htmlFor="trainer-search" className="sr-only">
              Search trainers
            </label>
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="trainer-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by trainer name, email, or specialty..."
              className="input-field pl-10"
            />
          </search>

          <div className="flex items-center gap-2">
            {[
              { key: "all", label: "All" },
              { key: "available", label: "Available" },
              { key: "unavailable", label: "Unavailable" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setAvailabilityFilter(item.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                  availabilityFilter === item.key
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
          <LoadingState label="Loading trainers..." />
        ) : error ? (
          <ErrorBanner message={error} onRetry={fetchTrainers} />
        ) : filteredTrainers.length === 0 ? (
          <EmptyState
            icon={DumbbellIcon}
            title="No trainers found"
            description="Add your first trainer to start assigning workout and nutrition coaching."
            action={
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
              >
                <PlusIcon className="w-4 h-4" />
                Add Trainer
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTrainers.map((trainer) => {
              const currentLoad = trainer.assignedMembers?.length || 0;
              const maxCapacity = trainer.maxCapacity || 30;
              const loadPercentage = Math.min(
                100,
                Math.round((currentLoad / maxCapacity) * 100)
              );

              const specs = Array.isArray(trainer.specializations)
                ? trainer.specializations
                : trainer.specialization
                ? [trainer.specialization]
                : [];

              return (
                <div
                  key={trainer._id}
                  className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={trainer.user?.profileImage}
                          name={trainer.user?.name}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white truncate">
                            {trainer.user?.name || "Trainer"}
                          </h3>
                          <p className="text-xs text-slate-400 truncate">
                            {trainer.user?.email}
                          </p>
                          {trainer.user?.phone && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {trainer.user.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <StatusBadge
                        status={trainer.isAvailable ? "available" : "unavailable"}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {specs.map((spec) => (
                        <span
                          key={spec}
                          className="text-xs font-medium bg-indigo-500/15 text-indigo-200 border border-indigo-500/25 px-2.5 py-1 rounded-lg"
                        >
                          {formatSpecialization(spec)}
                        </span>
                      ))}
                      <span className="text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                        <span className="font-semibold text-white">
                          {trainer.experience ?? 0}
                        </span>{" "}
                        yrs exp
                      </span>
                    </div>

                    {trainer.bio && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {trainer.bio}
                      </p>
                    )}

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>Client Capacity</span>
                        <span className="font-semibold text-slate-200 tabular-nums">
                          {currentLoad} / {maxCapacity} ({loadPercentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            loadPercentage >= 90
                              ? "bg-rose-500"
                              : loadPercentage >= 70
                              ? "bg-amber-500"
                              : "bg-indigo-500"
                          }`}
                          style={{ width: `${loadPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/trainers/${trainer._id}/members`)
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition"
                    >
                      <UsersIcon className="w-4 h-4 text-indigo-300" />
                      Members ({currentLoad})
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(trainer)}
                      aria-label={`Edit ${trainer.user?.name}`}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(trainer)}
                      aria-label={`Delete ${trainer.user?.name}`}
                      className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Trainer Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Trainer"
        subtitle="Provisions trainer account and coaching specialization."
        closedBy={isCreating ? "none" : "any"}
      >
        <form onSubmit={handleCreateTrainer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tr-name"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="tr-name"
                type="text"
                autoFocus
                required
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Chris Evans"
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="tr-phone"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Phone Number
              </label>
              <input
                id="tr-phone"
                type="tel"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+91 98765 43210"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tr-email"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                id="tr-email"
                type="email"
                spellCheck={false}
                required
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="coach@gympro.com"
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="tr-pass"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="tr-pass"
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  required
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Min 6 characters"
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="tr-spec"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Specialization <span className="text-rose-400">*</span>
              </label>
              <select
                id="tr-spec"
                required
                value={createForm.specialization}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, specialization: e.target.value }))
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
                htmlFor="tr-exp"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Experience (yrs) <span className="text-rose-400">*</span>
              </label>
              <input
                id="tr-exp"
                type="number"
                min="0"
                required
                value={createForm.experience}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, experience: e.target.value }))
                }
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="tr-cap"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Max Capacity
              </label>
              <input
                id="tr-cap"
                type="number"
                min="1"
                value={createForm.maxCapacity}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, maxCapacity: e.target.value }))
                }
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="tr-bio"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Coaching Bio
            </label>
            <textarea
              id="tr-bio"
              rows={3}
              maxLength={500}
              value={createForm.bio}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, bio: e.target.value }))
              }
              placeholder="Certifications, coaching philosophy, or specialties..."
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isCreating}
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              {isCreating ? "Creating..." : "Create Trainer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Trainer Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit Trainer — ${editTarget?.user?.name || ""}`}
        closedBy={isSavingEdit ? "none" : "any"}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="edit-tr-spec"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Specialization
              </label>
              <select
                id="edit-tr-spec"
                value={editForm.specialization || "weight_training"}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, specialization: e.target.value }))
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
                htmlFor="edit-tr-exp"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Experience (yrs)
              </label>
              <input
                id="edit-tr-exp"
                type="number"
                min="0"
                value={editForm.experience ?? "0"}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, experience: e.target.value }))
                }
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="edit-tr-cap"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Max Capacity
              </label>
              <input
                id="edit-tr-cap"
                type="number"
                min="1"
                value={editForm.maxCapacity ?? "30"}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, maxCapacity: e.target.value }))
                }
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-tr-bio"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Coaching Bio
            </label>
            <textarea
              id="edit-tr-bio"
              rows={3}
              maxLength={500}
              value={editForm.bio || ""}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, bio: e.target.value }))
              }
              className="input-field"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="edit-tr-avail"
              type="checkbox"
              checked={Boolean(editForm.isAvailable)}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, isAvailable: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-600"
            />
            <label htmlFor="edit-tr-avail" className="text-sm text-slate-200">
              Trainer is available for new member assignments
            </label>
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Trainer"
        message={`Remove trainer "${deleteTarget?.user?.name}"? Note: trainers with assigned members must have their members reassigned first.`}
        confirmLabel="Delete Trainer"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
};

export default TrainersPage;
