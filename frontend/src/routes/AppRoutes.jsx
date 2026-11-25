import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ProtectedRoutes from "./protectedRoutes";
import { LoadingState } from "../components/ui/StateViews";
import { ROLE_HOME_ROUTES } from "../utils/constants";

import LoginPage from "../dashboards/auth/LoginPage";

const SuperAdminDashboard = lazy(() =>
  import("../dashboards/superadmin/pages/SuperAdminDashboard")
);
const ManageAdmins = lazy(() =>
  import("../dashboards/superadmin/pages/ManageAdmins")
);
const SuperAdminProfile = lazy(() =>
  import("../dashboards/superadmin/pages/SuperAdminProfile")
);

const AdminDashboard = lazy(() =>
  import("../dashboards/admin/pages/AdminDashBoard")
);
const AdminProfile = lazy(() =>
  import("../dashboards/admin/pages/AdminProfile")
);
const MembersPage = lazy(() =>
  import("../dashboards/admin/pages/MembersPage")
);
const TrainersPage = lazy(() =>
  import("../dashboards/admin/pages/TrainersPage")
);
const TrainerMembersPage = lazy(() =>
  import("../dashboards/admin/pages/TrainerMembersPage")
);
const PaymentsPage = lazy(() =>
  import("../dashboards/admin/pages/PaymentsPage")
);
const AttendancePage = lazy(() =>
  import("../dashboards/admin/pages/AttendancePage")
);

const TrainerDashboard = lazy(() =>
  import("../dashboards/trainer/pages/TrainerDashboard")
);
const TrainerProfile = lazy(() =>
  import("../dashboards/trainer/pages/TrainerProfile")
);
const MyMembersPage = lazy(() =>
  import("../dashboards/trainer/pages/MyMembersPage")
);
const MemberCoachingPage = lazy(() =>
  import("../dashboards/trainer/pages/MemberCoachingPage")
);

const MemberDashboard = lazy(() =>
  import("../dashboards/member/pages/MemberDashboard")
);
const MemberProfile = lazy(() =>
  import("../dashboards/member/pages/MemberProfilePage")
);
const CheckInPage = lazy(() =>
  import("../dashboards/member/pages/CheckInPage")
);
const WorkoutPlansPage = lazy(() =>
  import("../dashboards/member/pages/WorkoutPlansPage")
);
const DietPlansPage = lazy(() =>
  import("../dashboards/member/pages/DietPlansPage")
);
const MemberPaymentsPage = lazy(() =>
  import("../dashboards/member/pages/MemberPaymentsPage")
);
const NotificationsPage = lazy(() =>
  import("../dashboards/member/pages/NotificationsPage")
);

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  const homePath = user?.role ? ROLE_HOME_ROUTES[user.role] || "/login" : "/login";

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingState label="Loading workspace..." />
        </div>
      }
    >
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to={homePath} replace /> : <LoginPage />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to={homePath} replace />
            ) : (
              <LoginPage initialMode="register" />
            )
          }
        />

        {/* SuperAdmin Routes */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoutes allowedRoles={["superAdmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/superadmin/profile"
          element={
            <ProtectedRoutes allowedRoles={["superAdmin"]}>
              <SuperAdminProfile />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/superadmin/admins"
          element={
            <ProtectedRoutes allowedRoles={["superAdmin"]}>
              <ManageAdmins />
            </ProtectedRoutes>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoutes allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoutes allowedRoles={["admin"]}>
              <AdminProfile />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/admin/members"
          element={
            <ProtectedRoutes allowedRoles={["admin"]}>
              <MembersPage />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/admin/trainers"
          element={
            <ProtectedRoutes allowedRoles={["admin"]}>
              <TrainersPage />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/admin/trainers/:id/members"
          element={
            <ProtectedRoutes allowedRoles={["admin"]}>
              <TrainerMembersPage />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoutes allowedRoles={["admin"]}>
              <PaymentsPage />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoutes allowedRoles={["admin"]}>
              <AttendancePage />
            </ProtectedRoutes>
          }
        />

        {/* Trainer Routes */}
        <Route
          path="/trainer/dashboard"
          element={
            <ProtectedRoutes allowedRoles={["trainer"]}>
              <TrainerDashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/trainer/profile"
          element={
            <ProtectedRoutes allowedRoles={["trainer"]}>
              <TrainerProfile />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/trainer/members"
          element={
            <ProtectedRoutes allowedRoles={["trainer"]}>
              <MyMembersPage />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/trainer/members/:id"
          element={
            <ProtectedRoutes allowedRoles={["trainer"]}>
              <MemberCoachingPage />
            </ProtectedRoutes>
          }
        />

        {/* Member Routes */}
        <Route
          path="/member/dashboard"
          element={
            <ProtectedRoutes allowedRoles={["member"]}>
              <MemberDashboard />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/member/profile"
          element={
            <ProtectedRoutes allowedRoles={["member"]}>
              <MemberProfile />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/member/checkin"
          element={
            <ProtectedRoutes allowedRoles={["member"]}>
              <CheckInPage />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/member/workouts"
          element={
            <ProtectedRoutes allowedRoles={["member"]}>
              <WorkoutPlansPage />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/member/diets"
          element={
            <ProtectedRoutes allowedRoles={["member"]}>
              <DietPlansPage />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/member/payments"
          element={
            <ProtectedRoutes allowedRoles={["member"]}>
              <MemberPaymentsPage />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/member/notifications"
          element={
            <ProtectedRoutes allowedRoles={["member"]}>
              <NotificationsPage />
            </ProtectedRoutes>
          }
        />

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? homePath : "/login"} replace />}
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
