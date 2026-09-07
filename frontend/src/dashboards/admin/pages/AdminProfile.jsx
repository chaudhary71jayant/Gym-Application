import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import api from "../../../services/api";
import authService from "../../../services/auth.service";

const AdminProfile = () => {
    const { user, login } = useAuth();

    const [profileForm, setProfileForm] = useState({
        name: "",
        phone: "",
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
    const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

    const [profileImage, setProfileImage] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.get("/user/me");
                const userData = data.data.user;

                setProfileForm({
                    name: userData.name || "",
                    phone: userData.phone || "",
                });

                setProfileImage(userData.profileImage || "");
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setIsProfileLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileMessage({ type: "", text: "" });

        try {
            const data = await api.put("/user/me", profileForm);
            const updatedUser = data.data.user;

            login({ ...user, name: updatedUser.name });

            setProfileMessage({
                type: "success",
                text: "Profile updated successfully!",
            });
        } catch (err) {
            setProfileMessage({
                type: "error",
                text:
                    err.response?.data?.message ||
                    "Failed to update profile.",
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setIsUploadingImage(true);
        setProfileMessage({ type: "", text: "" });

        try {
            const formData = new FormData();
            formData.append("image", file);

            const data = await api.put(
                "/user/me/profile-image",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setProfileImage(data.data.user.profileImage);

            setProfileMessage({
                type: "success",
                text: "Profile picture updated!",
            });
        } catch (err) {
            setProfileMessage({
                type: "error",
                text:
                    err.response?.data?.message ||
                    "Failed to upload image.",
            });
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: "", text: "" });

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({
                type: "error",
                text: "New passwords do not match.",
            });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordMessage({
                type: "error",
                text: "New password must be at least 6 characters.",
            });
            return;
        }

        setIsChangingPassword(true);

        try {
            await authService.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });

            setPasswordMessage({
                type: "success",
                text: "Password changed successfully!",
            });

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err) {
            setPasswordMessage({
                type: "error",
                text:
                    err.response?.data?.message ||
                    "Failed to change password.",
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isProfileLoading) {
        return (
            <DashboardLayout title="Profile">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Loading profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Profile">
            <div className="max-w-2xl space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-6">
                        Profile Information
                    </h3>

                    <div className="flex items-center gap-6 mb-6">
                        <div className="relative">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <label
                                htmlFor="imageUpload"
                                className="absolute bottom-0 right-0 bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 cursor-pointer transition"
                                title="Change photo"
                            >
                                <span className="text-xs">📷</span>
                            </label>

                            <input
                                id="imageUpload"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        <div>
                            <p className="text-white font-medium">
                                {user?.name}
                            </p>
                            <p className="text-gray-400 text-sm">
                                {user?.email}
                            </p>
                            <p className="text-gray-500 text-xs mt-1 capitalize">
                                {user?.role}
                            </p>

                            {isUploadingImage && (
                                <p className="text-blue-400 text-xs mt-1">
                                    Uploading...
                                </p>
                            )}
                        </div>
                    </div>

                    {profileMessage.text && (
                        <div
                            className={`px-4 py-3 rounded-lg mb-4 text-sm ${
                                profileMessage.type === "success"
                                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                            }`}
                        >
                            {profileMessage.text}
                        </div>
                    )}

                    <form
                        onSubmit={handleProfileSubmit}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>

                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full bg-gray-800 border border-gray-700 text-gray-500 rounded-lg px-4 py-3 text-sm cursor-not-allowed"
                            />

                            <p className="text-gray-600 text-xs mt-1">
                                Email cannot be changed
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Full Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={profileForm.name}
                                onChange={handleProfileChange}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Phone Number
                            </label>

                            <input
                                type="text"
                                name="phone"
                                value={profileForm.phone}
                                onChange={handleProfileChange}
                                placeholder="Enter phone number"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition text-sm"
                        >
                            {isSavingProfile
                                ? "Saving..."
                                : "Save Changes"}
                        </button>
                    </form>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-6">
                        Change Password
                    </h3>

                    {passwordMessage.text && (
                        <div
                            className={`px-4 py-3 rounded-lg mb-4 text-sm ${
                                passwordMessage.type === "success"
                                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                            }`}
                        >
                            {passwordMessage.text}
                        </div>
                    )}

                    <form
                        onSubmit={handlePasswordSubmit}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Current Password
                            </label>

                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                New Password
                            </label>

                            <input
                                type="password"
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm New Password
                            </label>

                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition text-sm"
                        >
                            {isChangingPassword
                                ? "Changing..."
                                : "Change Password"}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminProfile;