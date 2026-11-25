import { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import userService from "../../services/user.service";
import authService from "../../services/auth.service";
import { getErrorMessage } from "../../utils/formatters";
import Avatar from "./Avatar";
import { LoadingState } from "./StateViews";
import { CameraIcon, CheckCircleIcon, EyeIcon, EyeOffIcon } from "./Icons";

const ROLE_LABELS = {
  superAdmin: "Super Admin",
  admin: "Administrator",
  trainer: "Trainer",
  member: "Member",
};

const ProfileSettings = ({ children }) => {
  const { user, updateAuthUser } = useAuth();
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  useEffect(() => {
    let active = true;
    userService
      .getMyProfile()
      .then((res) => {
        if (!active || !res?.user) return;
        setProfileData(res.user);
        setProfileForm({
          name: res.user.name || "",
          phone: res.user.phone || "",
        });
        updateAuthUser({
          name: res.user.name,
          phone: res.user.phone || "",
          profileImage: res.user.profileImage || "",
        });
      })
      .catch((err) => {
        showToast(getErrorMessage(err, "Failed to load profile."), "error");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast, updateAuthUser]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be smaller than 5MB.", "error");
      return;
    }

    setIsUploadingImage(true);
    try {
      const res = await userService.uploadProfileImage(file);
      const nextImg = res?.user?.profileImage || "";
      setProfileData((prev) => ({ ...prev, profileImage: nextImg }));
      updateAuthUser({ profileImage: nextImg });
      showToast("Profile picture updated!");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to upload image."), "error");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast("Full name cannot be empty.", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await userService.updateMyProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });
      const updated = res?.user;
      if (updated) {
        setProfileData(updated);
        updateAuthUser({
          name: updated.name,
          phone: updated.phone || "",
        });
      }
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update profile."), "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast("Please fill in your current and new passwords.", "error");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast("Password changed successfully!");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to change password."), "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading profile settings..." />;
  }

  const displayUser = profileData || user;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              src={displayUser?.profileImage}
              name={displayUser?.name}
              size="xl"
            />
            <label
              htmlFor="profile-avatar-upload"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 border-2 border-slate-900 flex items-center justify-center text-white cursor-pointer transition shadow-lg"
              title="Upload profile photo"
            >
              <CameraIcon className="w-4 h-4" />
              <span className="sr-only">Upload profile photo</span>
            </label>
            <input
              id="profile-avatar-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={isUploadingImage}
              className="sr-only"
            />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white">{displayUser?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {ROLE_LABELS[displayUser?.role] || displayUser?.role}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{displayUser?.email}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
              {isUploadingImage
                ? "Uploading photo to cloud..."
                : "JPG, PNG, or WEBP up to 5MB"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          {/* Account Info Form */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-1">
              Personal Information
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Update your name and contact number visible across the club.
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={displayUser?.email || ""}
                  disabled
                  className="input-field"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Account email cannot be modified directly.
                </p>
              </div>

              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition"
              >
                {isSavingProfile ? "Saving changes..." : "Save Profile Changes"}
              </button>
            </form>
          </div>

          {/* Password Security Form */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-1">
              Security &amp; Password
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Choose a strong password of at least 6 characters.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Current Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    name="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter current password"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    aria-pressed={showPasswords.current}
                    aria-label={
                      showPasswords.current ? "Hide current password" : "Show current password"
                    }
                    onClick={() =>
                      setShowPasswords((p) => ({ ...p, current: !p.current }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPasswords.current ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    name="newPassword"
                    type={showPasswords.next ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="At least 6 characters"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    aria-pressed={showPasswords.next}
                    aria-label={
                      showPasswords.next ? "Hide new password" : "Show new password"
                    }
                    onClick={() =>
                      setShowPasswords((p) => ({ ...p, next: !p.next }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPasswords.next ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Confirm New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Re-enter new password"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    aria-pressed={showPasswords.confirm}
                    aria-label={
                      showPasswords.confirm
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    onClick={() =>
                      setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPasswords.confirm ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-white text-sm font-semibold transition"
              >
                {isChangingPassword ? "Updating password..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Role-specific right column */}
        {children && <div className="space-y-6">{children}</div>}
      </div>
    </div>
  );
};

export default ProfileSettings;
