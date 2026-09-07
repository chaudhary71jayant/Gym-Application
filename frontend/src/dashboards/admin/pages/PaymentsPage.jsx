import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import paymentService from "../../../services/payment.service";

const statusStyles = {
    pending: "bg-yellow-500/20 text-yellow-400",
    completed: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
    refunded: "bg-blue-500/20 text-blue-400",
};

const PaymentsPage = () => {
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        const fetchPayments = async () => {
            setIsLoading(true);

            try {
                const data = await paymentService.getAllPayments(filter);
                setPayments(data.payments);
            } catch (err) {
                setError("Failed to load payments.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPayments();
    }, [filter]);

    const handleStatusUpdate = async (paymentId, newStatus) => {
        setUpdatingId(paymentId);

        try {
            await paymentService.updatePaymentStatus(paymentId, newStatus);

            setPayments((prev) =>
                prev.map((p) =>
                    p._id === paymentId
                        ? { ...p, paymentStatus: newStatus }
                        : p
                )
            );
        } catch (err) {
            alert("Failed to update payment status. Please try again.");
            console.error(err);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <DashboardLayout title="Payments">
            <div className="space-y-6">
                <div className="flex gap-2 flex-wrap">
                    {["", "pending", "completed", "failed", "refunded"].map(
                        (status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    filter === status
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-800 text-gray-400 hover:text-white"
                                }`}
                            >
                                {status === ""
                                    ? "All"
                                    : status.charAt(0).toUpperCase() +
                                      status.slice(1)}
                            </button>
                        )
                    )}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-gray-400">Loading payments...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                ) : payments.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                        <p className="text-gray-400">No payments found</p>
                    </div>
                ) : (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Member
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Method
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Plan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Period
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-800">
                                    {payments.map((payment) => (
                                        <tr
                                            key={payment._id}
                                            className="hover:bg-gray-800/50 transition"
                                        >
                                            <td className="px-6 py-4 text-sm text-white">
                                                {payment.member?.user?.name ||
                                                    "Unknown"}
                                                <p className="text-gray-500 text-xs">
                                                    {payment.member?.user?.email}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                                                ₹{payment.amount?.toLocaleString()}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-300 uppercase">
                                                {payment.paymentMethod}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-300 capitalize">
                                                {payment.membershipPlan}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                {new Date(
                                                    payment.membershipStart
                                                ).toLocaleDateString()}
                                                {" → "}
                                                {new Date(
                                                    payment.membershipEnd
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[payment.paymentStatus]}`}
                                                >
                                                    {payment.paymentStatus}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                {payment.paymentStatus ===
                                                "pending" ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleStatusUpdate(
                                                                    payment._id,
                                                                    "completed"
                                                                )
                                                            }
                                                            disabled={
                                                                updatingId ===
                                                                payment._id
                                                            }
                                                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition"
                                                        >
                                                            {updatingId ===
                                                            payment._id
                                                                ? "..."
                                                                : "Complete"}
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleStatusUpdate(
                                                                    payment._id,
                                                                    "failed"
                                                                )
                                                            }
                                                            disabled={
                                                                updatingId ===
                                                                payment._id
                                                            }
                                                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition"
                                                        >
                                                            {updatingId ===
                                                            payment._id
                                                                ? "..."
                                                                : "Failed"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600 text-xs">
                                                        —
                                                    </span>
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
        </DashboardLayout>
    );
};

export default PaymentsPage;