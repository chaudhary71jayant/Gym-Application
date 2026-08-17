import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoutes from "./protectedRoutes";

import LoginPage from "../dashboards/auth/LoginPage";

import SuperAdminDashboard from "../dashboards/superadmin/pages/SuperAdminDashboards";
import ManageAdmins from "../dashboards/admin/pages/AdminDashBoard";

import AdminDashboard from "../dashboards/admin/pages/AdminDashboard";
import MembersPage from "../dashboards/admin/pages/MembersPage";
import TrainersPage from "../dashboards/admin/pages/TrainersPage";
import PaymentsPage from "../dashboards/admin/pages/PaymentsPage";
import AttendancePage from "../dashboards/admin/pages/AttendancePage";

import TrainerDashboard from "../dashboards/trainer/pages/TrainerDashboard";
import MyMembersPage from "../dashboards/member/pages/MyMembersPage";

import MemberDashboard from "../dashboards/member/pages/MemberDashboard";
import CheckInPage from "../dashboards/member/pages/CheckInPage";
import WorkoutPlansPage from "../dashboards/member/pages/WorkoutPlansPage";
import DietPlansPage from "../dashboards/member/pages/DietPlansPage";
import MemberPaymentsPage from "../dashboards/member/pages/MemberPaymentsPage";
import NotificationsPage from "../dashboards/member/pages/NotificationsPage";


const AppRoutes = () => {
    const { isAuthenticated, user } = useAuth();

    const roleRedirects = {
        superAdmin : "/superadmin/dashboard",
        admin : "/admin/dashboard",
        trainer : "/trainer/dashboard",
        member : "/member/dashboard",
    };

    return(
        <Routes>

            <Route
                path="/login"
                element={
                    isAuthenticated
                        ? <Navigate to={roleRedirects[user.role]} replace />
                        : <LoginPage />
                }
            />

            <Route path="/superadmin/dashboard" element={
                <ProtectedRoutes allowedRoles={["superAdmin"]}>
                    <SuperAdminDashboard />
                </ProtectedRoutes>
            } />
            <Route path="/superadmin/admins" element = {
                <ProtectedRoutes allowedRoles={["superAdmin"]}>
                    <ManageAdmins />
                </ProtectedRoutes>
            }
            />

            <Route path="/admin/dashboard" element ={
                <ProtectedRoutes allowedRoles={["admin"]}>
                    <AdminDashboard />
                </ProtectedRoutes>
            }
            />
            <Route path="/admin/members" element={
                <ProtectedRoutes allowedRoles={["admin"]}>
                    <MembersPage />
                </ProtectedRoutes>
            }
            />
            <Route path="/admin/trainers" element={
                <ProtectedRoutes allowedRoles={["admin"]}>
                    <TrainersPage />
                </ProtectedRoutes>
            }
            />
            <Route path="/admin/payments" element={
                <ProtectedRoutes allowedRoles={["admin"]}>
                    <PaymentsPage />
                </ProtectedRoutes>
            }
            />
            <Route path="/admin/attendance" element={
                <ProtectedRoutes allowedRoles={["admin"]}>
                    <AttendancePage />
                </ProtectedRoutes>
            }
            />

            <Route path="/trainer/dashboard" element={
                <ProtectedRoutes allowedRoles={["trainer"]}>
                    <TrainerDashboard />
                </ProtectedRoutes>
            }
            />
            <Route path="/trainer/members" element={
                <ProtectedRoutes allowedRoles={["trainer"]}>
                    <MyMembersPage />
                </ProtectedRoutes>
            }
            />

            <Route path="/member/dashboard" element={
                <ProtectedRoutes allowedRoles={["member"]}>
                    <MemberDashboard/>
                </ProtectedRoutes>
            }
             />
            <Route path="/member/checkin" element={
                <ProtectedRoutes allowedRoles={["member"]}>
                    <CheckInPage />
                </ProtectedRoutes>
            }
             />
            <Route path="/member/workouts" element={
                <ProtectedRoutes allowedRoles={["member"]}>
                    <WorkoutPlansPage/>
                </ProtectedRoutes>
            }
             />
            <Route path="/member/diets" element={
                <ProtectedRoutes allowedRoles={["member"]}>
                    <DietPlansPage />
                </ProtectedRoutes>
            }
             />
            <Route path="/member/payments" element={
                <ProtectedRoutes allowedRoles={["member"]}>
                    <PaymentsPage/>
                </ProtectedRoutes>
            }
             />
            <Route path="/member/notifications" element={
                <ProtectedRoutes allowedRoles={["member"]}>
                    <NotificationsPage />
                </ProtectedRoutes>
            }
            />

            <Route path="*" element={<Navigate to="/login" replace />}/>

        </Routes>
    )
}

export default AppRoutes;