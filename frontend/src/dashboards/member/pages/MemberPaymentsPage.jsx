import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import StatCard from "../../../components/ui/StatCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, ErrorBanner, LoadingState } from "../../../components/ui/StateViews";
import {
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
} from "../../../components/ui/Icons";
import memberService from "../../../services/member.service";
import paymentService from "../../../services/payment.service";
import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  formatPlanName,
  getDaysRemaining,
  getErrorMessage,
} from "../../../utils/formatters";

const MemberPaymentsPage = () => {
  const [member, setMember] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    const profileRes = await memberService.getMyMemberProfile();
    const me = profileRes?.member || null;
    if (!me?._id) return { member: null, payments: [] };
    const payRes = await paymentService.getMemberPayments(me._id);
    return { member: me, payments: payRes?.payments || [] };
  }, []);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAll();
      setMember(data.member);
      setPayments(data.payments);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load payment history."));
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
        setPayments(data.payments);
        setError("");
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Failed to load payment history."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const stats = useMemo(() => {
    return payments.reduce(
      (acc, p) => {
        if (p.paymentStatus === "success") {
          acc.paid += Number(p.amount || 0);
          acc.successCount += 1;
        } else if (p.paymentStatus === "pending") {
          acc.pendingCount += 1;
        }
        return acc;
      },
      { paid: 0, successCount: 0, pendingCount: 0 }
    );
  }, [payments]);

  const daysLeft = getDaysRemaining(member?.membershipEnd);

  return (
    <DashboardLayout
      title="Payments & Membership"
      subtitle="View your active plan validity and billing history"
    >
      {isLoading ? (
        <LoadingState label="Loading billing history..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadPayments} />
      ) : (
        <div className="space-y-6">
          {/* Membership Banner */}
          {member && (
            <div className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-bold text-white">
                    {formatPlanName(member.membershipPlan)} Membership
                  </h2>
                  <StatusBadge status={member.membershipStatus} />
                </div>
                <p className="text-xs text-slate-300">
                  {member.membershipStart && member.membershipEnd
                    ? `Period: ${formatDate(member.membershipStart)} → ${formatDate(
                        member.membershipEnd
                      )}`
                    : "Validity dates will update once your next payment is confirmed."}
                </p>
              </div>
              {daysLeft !== null && (
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-400">Days Remaining</p>
                  <p
                    className={`text-2xl font-extrabold font-mono tabular-nums ${
                      daysLeft <= 7 ? "text-amber-300" : "text-emerald-300"
                    }`}
                  >
                    {Math.max(0, daysLeft)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Paid"
              value={formatCurrency(stats.paid)}
              icon={CreditCardIcon}
              tone="emerald"
            />
            <StatCard
              label="Confirmed Invoices"
              value={stats.successCount}
              icon={CheckCircleIcon}
              tone="indigo"
            />
            <StatCard
              label="Pending Invoices"
              value={stats.pendingCount}
              icon={ClockIcon}
              tone="amber"
            />
          </div>

          {/* Payment Ledger */}
          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCardIcon}
              title="No payment transactions yet"
              description="Your membership fee invoices and receipts will appear here."
            />
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div
                tabIndex={0}
                role="region"
                aria-label="Member payments table"
                className="overflow-x-auto"
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/90 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Plan
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Amount
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Method
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Coverage Period
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Paid Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-slate-800/40">
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          {formatPlanName(payment.membershipPlan)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-300 font-mono tabular-nums">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-300">
                          {formatPaymentMethod(payment.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300 whitespace-nowrap">
                          {formatDate(payment.membershipStart)} →{" "}
                          {formatDate(payment.membershipEnd)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={payment.paymentStatus} />
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                          {payment.paidAt
                            ? formatDate(payment.paidAt)
                            : formatDate(payment.createdAt)}
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

export default MemberPaymentsPage;
