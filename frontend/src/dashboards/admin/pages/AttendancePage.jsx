import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import attendanceService from "../../../services/attendance.service";

const formatTime = (dateString) => {
    if (!dateString) return "—";

    return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const AttendancePage = () => {
    const [attendance, setAttendance] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const data = await attendanceService.getTodayAttendance();
                setAttendance(data.attendance);
            } catch (err) {
                setError("Failed to load today's attendance.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttendance();
    }, []);

    if (isLoading) {
        return (
            <DashboardLayout title="Attendance">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Loading attendance...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Attendance">
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </DashboardLayout>
        );
    }

    const stillInGym = attendance.filter(
        (a) => a.checkIn && !a.checkOut
    ).length;

    return (
        <DashboardLayout title="Attendance">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm">
                        {new Date().toLocaleDateString("en-IN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <p className="text-gray-400 text-sm">
                            Total Check-ins
                        </p>
                        <p className="text-3xl font-bold text-white mt-1">
                            {attendance.length}
                        </p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <p className="text-gray-400 text-sm">
                            Currently in Gym
                        </p>
                        <p className="text-3xl font-bold text-green-400 mt-1">
                            {stillInGym}
                        </p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <p className="text-gray-400 text-sm">
                            Checked Out
                        </p>
                        <p className="text-3xl font-bold text-blue-400 mt-1">
                            {attendance.length - stillInGym}
                        </p>
                    </div>
                </div>

                {attendance.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                        <p className="text-gray-400">
                            No check-ins recorded today yet
                        </p>
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
                                            Check In
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Check Out
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Duration
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-800">
                                    {attendance.map((record) => (
                                        <tr
                                            key={record._id}
                                            className="hover:bg-gray-800/50 transition"
                                        >
                                            <td className="px-6 py-4 text-sm text-white">
                                                {record.member?.user?.name ||
                                                    "Unknown"}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                {formatTime(record.checkIn)}
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                {record.checkOut ? (
                                                    <span className="text-gray-300">
                                                        {formatTime(
                                                            record.checkOut
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-400 text-xs font-medium">
                                                        Still in gym
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                {record.sessionDuration
                                                    ? `${record.sessionDuration} min`
                                                    : "—"}
                                            </td>

                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        record.status ===
                                                        "present"
                                                            ? "bg-green-500/20 text-green-400"
                                                            : record.status ===
                                                              "late"
                                                            ? "bg-yellow-500/20 text-yellow-400"
                                                            : "bg-red-500/20 text-red-400"
                                                    }`}
                                                >
                                                    {record.status}
                                                </span>
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

export default AttendancePage;
