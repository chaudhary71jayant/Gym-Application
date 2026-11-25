import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import StatCard from "../../../components/ui/StatCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  CheckIcon,
  ClockIcon,
  CreditCardIcon,
  PlusIcon,
  SearchIcon,
} from "../../../components/ui/Icons";
import useToast from "../../../hooks/useToast";
import paymentService from "../../../services/payment.service";
import memberService from "../../../services/member.service";
import {
  MEMBERSHIP_PLANS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "../../../utils/constants";
import {
  computePlanEndDate,
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  formatPlanName,
  getErrorMessage,
} from "../../../utils/formatters";

const createInitialPaymentForm = () => {
  const today = new Date().toISOString().slice(0, 10);
  const plan = MEMBERSHIP_PLANS[0];
  return {
    memberId: "",
    membershipPlan: plan.value,
    amount: String(plan.defaultPrice),
    paymentMethod: "upi",
    membershipStart: today,
    membershipEnd: computePlanEndDate(today, plan.value),
    notes: "",
  };
};

const PaymentsPage = () => {
  const { showToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(createInitialPaymentForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [refundTarget, setRefundTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    const [paymentsRes, membersRes] = await Promise.all([
      paymentService.getAllPayments(statusFilter),
      memberService.getAllMembers(),
    ]);
    return {
      payments: paymentsRes?.payments || [],
      members: membersRes?.members || [],
    };
  }, [statusFilter]);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAll();
      setPayments(data.payments);
      setMembers(data.members);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load payments."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((data) => {
        if (!active) return;
        setPayments(data.payments);
        setMembers(data.members);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load payments."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        p.member?.user?.name?.toLowerCase().includes(q) ||
        p.member?.user?.email?.toLowerCase().includes(q) ||
        p.membershipPlan?.toLowerCase().includes(q) ||
        p.paymentMethod?.toLowerCase().includes(q)
    );
  }, [payments, searchQuery]);

  const summary = useMemo(() => {
    return payments.reduce(
      (acc, p) => {
        if (p.paymentStatus === "success") {
          acc.collected += Number(p.amount || 0);
          acc.successCount += 1;
        } else if (p.paymentStatus === "pending") {
          acc.pendingAmount += Number(p.amount || 0);
          acc.pendingCount += 1;
        }
        return acc;
      },
      { collected: 0, successCount: 0, pendingAmount: 0, pendingCount: 0 }
    );
  }, [payments]);

  const handleStatusUpdate = async (paymentId, newStatus) => {
    setUpdatingId(paymentId);
    try {
      const res = await paymentService.updatePaymentStatus(paymentId, newStatus);
      const updatedPayment = res?.payment;
      setPayments((prev) =>
        prev
          .map((p) =>
            p._id === paymentId
              ? {
                  ...p,
                  paymentStatus: updatedPayment?.paymentStatus || newStatus,
                  paidAt: updatedPayment?.paidAt || p.paidAt,
                }
              : p
          )
          .filter((p) => (!statusFilter ? true : p.paymentStatus === statusFilter))
      );
      showToast(
        newStatus === "success"
          ? "Payment confirmed and membership activated!"
          : `Payment marked as ${newStatus}.`
      );
      setRefundTarget(null);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update payment status."), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePlanChange = (nextPlan) => {
    const planInfo = MEMBERSHIP_PLANS.find((p) => p.value === nextPlan);
    setPaymentForm((prev) => ({
      ...prev,
      membershipPlan: nextPlan,
      amount: planInfo ? String(planInfo.defaultPrice) : prev.amount,
      membershipEnd: computePlanEndDate(prev.membershipStart, nextPlan),
    }));
  };

  const handleStartDateChange = (nextStart) => {
    setPaymentForm((prev) => ({
      ...prev,
      membershipStart: nextStart,
      membershipEnd: computePlanEndDate(nextStart, prev.membershipPlan),
    }));
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.memberId || !paymentForm.amount) {
      showToast("Please select a member and enter the payment amount.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentService.createPayment({
        memberId: paymentForm.memberId,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        membershipPlan: paymentForm.membershipPlan,
        membershipStart: paymentForm.membershipStart,
        membershipEnd: paymentForm.membershipEnd,
        notes: paymentForm.notes.trim(),
      });
      showToast("Payment invoice created as pending.");
      setIsCreateOpen(false);
      setPaymentForm(createInitialPaymentForm());
      await fetchPayments();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to create payment."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Payments & Billing"
      subtitle="Create invoices, confirm payments, and activate memberships"
      actions={
        <button
          type="button"
          onClick={() => {
            setPaymentForm(createInitialPaymentForm());
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-950/50 transition"
        >
          <PlusIcon className="w-4 h-4" />
          Record Payment
        </button>
      }
    >
      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Confirmed Revenue"
            value={formatCurrency(summary.collected)}
            hint={`${summary.successCount} confirmed payment(s)`}
            icon={CreditCardIcon}
            tone="emerald"
          />
          <StatCard
            label="Pending Collection"
            value={formatCurrency(summary.pendingAmount)}
            hint={`${summary.pendingCount} awaiting verification`}
            icon={ClockIcon}
            tone="amber"
          />
          <StatCard
            label="Visible Transactions"
            value={filteredPayments.length}
            hint={statusFilter ? `Filtered by "${statusFilter}"` : "All statuses"}
            icon={CheckIcon}
            tone="indigo"
          />
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <search className="relative flex-1 max-w-md">
            <label htmlFor="payments-search" className="sr-only">
              Search payments
            </label>
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="payments-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, plan, or method..."
              className="input-field pl-10"
            />
          </search>

          <div className="flex gap-2 flex-wrap">
            {[{ value: "", label: "All" }, ...PAYMENT_STATUSES].map((item) => (
              <button
                key={item.value || "all"}
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
          <LoadingState label="Loading payments..." />
        ) : error ? (
          <ErrorBanner message={error} onRetry={fetchPayments} />
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon={CreditCardIcon}
            title="No payments found"
            description="Record a new membership payment or clear your active filter."
            action={
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
              >
                <PlusIcon className="w-4 h-4" />
                Record Payment
              </button>
            }
          />
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div
              tabIndex={0}
              role="region"
              aria-label="Payments ledger"
              className="overflow-x-auto"
            >
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/90 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Member
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Amount
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Method
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Plan &amp; Period
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
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-white">
                          {payment.member?.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {payment.member?.user?.email || "—"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm font-bold text-emerald-300 tabular-nums whitespace-nowrap">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold text-slate-300 whitespace-nowrap">
                        {formatPaymentMethod(payment.paymentMethod)}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-300 whitespace-nowrap">
                        <p className="font-semibold text-white">
                          {formatPlanName(payment.membershipPlan)}
                        </p>
                        <p className="text-slate-400 mt-0.5">
                          {formatDate(payment.membershipStart)} →{" "}
                          {formatDate(payment.membershipEnd)}
                        </p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={payment.paymentStatus} />
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {payment.paymentStatus === "pending" ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={updatingId === payment._id}
                              onClick={() =>
                                handleStatusUpdate(payment._id, "success")
                              }
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition"
                            >
                              {updatingId === payment._id ? "..." : "Confirm Paid"}
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === payment._id}
                              onClick={() =>
                                handleStatusUpdate(payment._id, "failed")
                              }
                              className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 disabled:opacity-50 text-rose-300 text-xs font-semibold transition"
                            >
                              Mark Failed
                            </button>
                          </div>
                        ) : payment.paymentStatus === "success" ? (
                          <button
                            type="button"
                            disabled={updatingId === payment._id}
                            onClick={() => setRefundTarget(payment)}
                            className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold transition"
                          >
                            Refund
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Payment Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Membership Payment"
        subtitle="Creates a pending payment entry; confirm it to activate membership."
        closedBy={isSubmitting ? "none" : "any"}
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label
              htmlFor="pay-member"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Member <span className="text-rose-400">*</span>
            </label>
            <select
              id="pay-member"
              required
              autoFocus
              value={paymentForm.memberId}
              onChange={(e) =>
                setPaymentForm((p) => ({ ...p, memberId: e.target.value }))
              }
              className="input-field"
            >
              <option value="">Select a member...</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.user?.name} ({m.user?.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="pay-plan"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Membership Plan <span className="text-rose-400">*</span>
              </label>
              <select
                id="pay-plan"
                required
                value={paymentForm.membershipPlan}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="input-field"
              >
                {MEMBERSHIP_PLANS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="pay-method"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Payment Method <span className="text-rose-400">*</span>
              </label>
              <select
                id="pay-method"
                required
                value={paymentForm.paymentMethod}
                onChange={(e) =>
                  setPaymentForm((p) => ({ ...p, paymentMethod: e.target.value }))
                }
                className="input-field"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="pay-amount"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Amount (INR ₹) <span className="text-rose-400">*</span>
            </label>
            <input
              id="pay-amount"
              type="number"
              min="0"
              required
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm((p) => ({ ...p, amount: e.target.value }))
              }
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="pay-start"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Coverage Start <span className="text-rose-400">*</span>
              </label>
              <input
                id="pay-start"
                type="date"
                required
                value={paymentForm.membershipStart}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="pay-end"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Coverage End <span className="text-rose-400">*</span>
              </label>
              <input
                id="pay-end"
                type="date"
                required
                value={paymentForm.membershipEnd}
                onChange={(e) =>
                  setPaymentForm((p) => ({ ...p, membershipEnd: e.target.value }))
                }
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="pay-notes"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Notes
            </label>
            <textarea
              id="pay-notes"
              rows={2}
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Optional receipt number or remarks..."
              className="input-field"
            />
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
              {isSubmitting ? "Creating..." : "Create Payment"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={() => handleStatusUpdate(refundTarget._id, "refunded")}
        title="Refund Payment"
        message={`Mark payment of ${formatCurrency(refundTarget?.amount)} from ${
          refundTarget?.member?.user?.name || "this member"
        } as refunded?`}
        confirmLabel="Mark Refunded"
        variant="warning"
        isLoading={updatingId === refundTarget?._id}
      />
    </DashboardLayout>
  );
};

export default PaymentsPage;
