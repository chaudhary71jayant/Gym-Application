import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import statsService from "../../../services/stats.service";

const StatsCard = ({ label, value, color }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <p className="text-gray-400 text-sm mb-2">{label}</p>
    <p className={`text-3xl font-bold ${color || "text-white"}`}>{value}</p>
  </div>
)

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsService.getAdminStats();
        setStats(response.stats);
      } catch (error) {
        setError("Failed to load dashboard stats. Please try again.", error);
      }finally{
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if(isLoading){
    return(
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading dashboard.....</p>
        </div>
      </DashboardLayout>
    );
  }

  if(error) {
    return(
      <DashboardLayout title="Dashboard">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">

        {/* stats card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Members"
            value = {stats.totalMembers}
            color="text-white"
          />
          <StatsCard
            label="Active Members"
            value = {stats.activeMembers}
            color="text-green-400"
          />
          <StatsCard
            label="Expired Members"
            value = {stats.expiredMembers}
            color="text-red-400"
          />
          <StatsCard
            label="Total Trainers"
            value = {stats.totalTrainers}
            color="text-blue-400"
          />
          <StatsCard
            label="Today's Attendance"
            value = {stats.todayAttendance}
            color="text-yellow-400"
          />
          <StatsCard
            label="Monthly Revenue"
            value = {stats.monthlyRevenue}
            color="text-purple-400"
          />

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Expiring Soon
              <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Next 7 Days</span>
            </h3>

            {stats.expiringMembers.length === 0 ? (
              <p className="text-gray-500 text-sm">No Memberships Expiring soon</p>
            ): (
              <div className="space-y-3">
                {stats.expiringMembers.map((member) => (
                  <div key={member._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{member.user.name}</p>
                      <p className="text-gray-500 text-xs">{member.user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 text-sm font-medium">
                        {/* Calculate days remaining */}
                        {Math.ceil(
                          (new Date(member.membershipEnd) - new Date()) /
                          (1000 * 60 * 60 * 24)
                        )}{" "}
                        days left
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(member.membershipEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payments */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Recent Payments</h3>

            {stats.recentPayments.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent payments</p>
            ) : (
              <div className="space-y-3">
                {stats.recentPayments.map((payment) => (
                  <div
                    key={payment._id}
                    className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">
                        {payment.member?.user?.name || "Unknown"}
                      </p>
                      <p className="text-gray-500 text-xs capitalize">
                        {payment.paymentMethod} · {payment.membershipPlan}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 text-sm font-medium">
                        ₹{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;