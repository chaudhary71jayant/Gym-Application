import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import Avatar from "../../../components/ui/Avatar";
import StatusBadge from "../../../components/ui/StatusBadge";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  TrashIcon,
} from "../../../components/ui/Icons";
import useToast from "../../../hooks/useToast";
import userService from "../../../services/user.service";
import { formatDate, getErrorMessage } from "../../../utils/formatters";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

const ManageAdmins = () => {
  const { showToast } = useToast();

  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await userService.getAllAdmins();
      setAdmins(res?.admins || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load admin accounts."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    userService
      .getAllAdmins()
      .then((res) => {
        if (!active) return;
        setAdmins(res?.admins || []);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load admin accounts."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredAdmins = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q)
    );
  }, [admins, searchQuery]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      showToast("Name, email, and password are required.", "error");
      return;
    }
    if (formData.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.createAdmin({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });
      showToast("Admin account created successfully!");
      setFormData(INITIAL_FORM);
      setIsCreateOpen(false);
      await fetchAdmins();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to create admin."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await userService.deleteAdmin(deleteTarget._id);
      setAdmins((prev) => prev.filter((a) => a._id !== deleteTarget._id));
      showToast(`Removed admin ${deleteTarget.name}.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete admin."), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout
      title="Manage Administrators"
      subtitle="Provision or revoke club administrator accounts"
      actions={
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-950/50 transition"
        >
          <PlusIcon className="w-4 h-4" />
          New Admin
        </button>
      }
    >
      <div className="space-y-6">
        {/* Search & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <search className="relative flex-1 max-w-md">
            <label htmlFor="admin-search" className="sr-only">
              Search admins
            </label>
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="admin-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search admins by name, email, or phone..."
              className="input-field pl-10"
            />
          </search>

          <p className="text-xs font-medium text-slate-400 tabular-nums">
            Showing {filteredAdmins.length} of {admins.length} administrator
            {admins.length === 1 ? "" : "s"}
          </p>
        </div>

        {isLoading ? (
          <LoadingState label="Loading administrators..." />
        ) : error ? (
          <ErrorBanner message={error} onRetry={fetchAdmins} />
        ) : filteredAdmins.length === 0 ? (
          <EmptyState
            icon={ShieldIcon}
            title="No administrators found"
            description={
              searchQuery
                ? "Try clearing your search filter."
                : "Create an administrator account to delegate daily gym management."
            }
            action={
              !searchQuery && (
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create First Admin
                </button>
              )
            }
          />
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div
              tabIndex={0}
              role="region"
              aria-label="Administrators table"
              className="overflow-x-auto"
            >
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/90 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Administrator
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Phone
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Created
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredAdmins.map((admin) => (
                    <tr
                      key={admin._id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={admin.profileImage} name={admin.name} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {admin.name}
                            </p>
                            <p className="text-xs text-slate-400">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                        {admin.phone || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={admin.isActive !== false ? "active" : "inactive"}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                        {formatDate(admin.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(admin)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold transition"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          Remove
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

      {/* Create Admin Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Club Administrator"
        subtitle="Admins manage members, trainers, payments, and attendance."
        closedBy={isSubmitting ? "none" : "any"}
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label
              htmlFor="admin-name"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="admin-name"
              name="name"
              type="text"
              autoComplete="name"
              autoFocus
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Jordan Lee"
              className="input-field"
            />
          </div>

          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="off"
              spellCheck={false}
              required
              value={formData.email}
              onChange={(e) =>
                setFormData((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="admin@gympro.com"
              className="input-field"
            />
          </div>

          <div>
            <label
              htmlFor="admin-phone"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Phone Number
            </label>
            <input
              id="admin-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="+91 98765 43210"
              className="input-field"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Temporary Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={6}
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, password: e.target.value }))
                }
                placeholder="Minimum 6 characters"
                className="input-field pr-11"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
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

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              {isSubmitting ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Administrator"
        message={`Are you sure you want to permanently remove "${deleteTarget?.name}" (${deleteTarget?.email})? They will lose access immediately.`}
        confirmLabel="Delete Admin"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
};

export default ManageAdmins;
