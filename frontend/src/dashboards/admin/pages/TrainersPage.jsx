import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashBoardLayout";
import trainerService from "../../../services/trainer.service";

const TrainersPage = () => {
    const [trainers, setTrainers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrainers = async () => {
            try {
                const data = await trainerService.getAllTrainers();
                setTrainers(data.trainers);
            } catch (err) {
                setError("Failed to load trainers. Please try again.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrainers();
    }, []);

    if (isLoading) {
        return (
            <DashboardLayout title="Trainers">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Loading trainers...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Trainers">
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Trainers">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm">
                        {trainers.length} trainer{trainers.length !== 1 ? "s" : ""} registered
                    </p>
                </div>

                {trainers.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                        <p className="text-gray-400 text-lg">No trainers found</p>
                        <p className="text-gray-600 text-sm mt-2">
                            Contact superadmin to add trainers
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trainers.map((trainer) => (
                            <TrainerCard
                                key={trainer._id}
                                trainer={trainer}
                                onViewMembers={() =>
                                    navigate(`/admin/trainers/${trainer._id}/members`)
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

const TrainerCard = ({ trainer, onViewMembers }) => {
    const currentLoad = trainer.assignedMembers?.length || 0;
    const maxCapacity = trainer.maxCapacity || 20;
    const loadPercentage = Math.round((currentLoad / maxCapacity) * 100);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {trainer.user?.name?.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <p className="text-white font-semibold">
                            {trainer.user?.name}
                        </p>
                        <p className="text-gray-500 text-xs">
                            {trainer.user?.email}
                        </p>
                    </div>
                </div>

                <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                        trainer.isAvailable
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                    }`}
                >
                    {trainer.isAvailable ? "Available" : "Unavailable"}
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {trainer.specializations?.map((spec) => (
                    <span
                        key={spec}
                        className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md capitalize"
                    >
                        {spec.replace("_", " ")}
                    </span>
                ))}
            </div>

            <p className="text-gray-400 text-sm">
                <span className="text-white font-medium">
                    {trainer.experience}
                </span>{" "}
                years experience
            </p>

            <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Members</span>
                    <span>
                        {currentLoad} / {maxCapacity}
                    </span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${
                            loadPercentage >= 90
                                ? "bg-red-500"
                                : loadPercentage >= 70
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                        }`}
                        style={{ width: `${loadPercentage}%` }}
                    />
                </div>
            </div>

            <button
                onClick={onViewMembers}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded-lg transition font-medium"
            >
                View Members ({currentLoad})
            </button>
        </div>
    );
};

export default TrainersPage;