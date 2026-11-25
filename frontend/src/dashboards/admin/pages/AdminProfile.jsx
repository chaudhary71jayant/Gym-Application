import DashboardLayout from "../../../components/layout/DashBoardLayout";
import ProfileSettings from "../../../components/ui/ProfileSettings";
import { ShieldIcon } from "../../../components/ui/Icons";

const AdminProfile = () => {
  return (
    <DashboardLayout
      title="Profile & Security"
      subtitle="Manage your administrator profile and password"
    >
      <ProfileSettings>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-300">
              <ShieldIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Club Administrator Capabilities
              </h3>
              <p className="text-xs text-slate-400">Full gym operations access</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            As a Club Administrator, you oversee member onboarding, trainer staffing,
            coach-member pairings, payment confirmations, and daily attendance tracking.
          </p>

          <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <li>• Onboard members and manage membership statuses</li>
            <li>• Create trainer profiles and balance coaching capacities</li>
            <li>• Assign or reassign trainers with automatic member alerts</li>
            <li>• Record and verify fee payments to activate plans</li>
          </ul>
        </div>
      </ProfileSettings>
    </DashboardLayout>
  );
};

export default AdminProfile;
