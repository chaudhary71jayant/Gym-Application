import DashboardLayout from "../../../components/layout/DashBoardLayout";
import ProfileSettings from "../../../components/ui/ProfileSettings";
import { ShieldIcon } from "../../../components/ui/Icons";

const SuperAdminProfile = () => {
  return (
    <DashboardLayout
      title="Profile & Security"
      subtitle="Manage your SuperAdmin identity and password"
    >
      <ProfileSettings>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300">
              <ShieldIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                SuperAdmin Scope &amp; Isolation
              </h3>
              <p className="text-xs text-slate-400">
                System-level governance boundary
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            SuperAdmin privileges are scoped to provisioning and removing Club
            Administrator accounts and reviewing high-level platform capacity. Daily
            workout plans, member billing, and attendance operations are isolated to
            Club Admins and Trainers.
          </p>

          <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <li>• Create and audit Club Administrator credentials</li>
            <li>• Monitor club membership and trainer capacity metrics</li>
            <li>• Revoke admin access instantaneously when roles change</li>
          </ul>
        </div>
      </ProfileSettings>
    </DashboardLayout>
  );
};

export default SuperAdminProfile;
