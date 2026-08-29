import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import memberService from "../../../services/member.service";


const MembersPage = () => {
    const[members, setMembers] = useState([]);
    const[isLoading, setIsLoading] = useState(true);
    const[error, setError] = useState("");

    useEffect(()=> {
        const fetchMembers = async() => {
            try {
                const data = await memberService.getAllMembers();
                setMembers(data.members);
            } catch (error) {
                setError("Failed to load all members");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMembers();
    }, []);

    if(isLoading){
        return(
            <DashboardLayout title="Members">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Loading Dashboard........</p>
                </div>
            </DashboardLayout>
        );
    };

    if(error){
        return(
            <DashboardLayout title="Members">
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </DashboardLayout>
        )
    };

    const statusColor = {
        active : "text-green-400",
        expired : "text-red-400",
        pending : "text-yellow-400",
        cancelled : "text-gray-400",
    };
    return(
        <DashboardLayout title="Members">
            <div className="bg-gray-900 border border-grey-800 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-6  text-gray-400">Loading...</div>
                ) : error ? (
                        <div className="p-6 text-red-400">{error}</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                    Phone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                    Fitness Goal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                    Membership Plan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                    End Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                    Trainer
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {members.map((member) => (
                                <tr 
                                key={member._id}
                                className="hover:bg-gray-800/50 transition">
                                    <td className="px-6 py-4 text-sm text-white">
                                        {member.user?.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white">
                                        {member.user?.email}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white">
                                        {member.user?.phone}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white">
                                        {member.fitnessGoal}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white">
                                        {member.membershipPlan}
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-semibold ${statusColor[member.membershipStatus] || "text-gray-300"}`}>
                                        {member.membershipStatus}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        {member.membershipEnd
                                        ? new Date(member.membershipEnd).toLocaleDateString() : "-"
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        {member.trainer?.user?.name || "Not Assigned"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                )}
            </div>
        </DashboardLayout>
    )
}

export default MembersPage;