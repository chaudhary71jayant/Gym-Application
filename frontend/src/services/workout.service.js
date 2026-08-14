import api from "./api.js";

const createWorkOutPlan = async ( data ) => {
    const response = await api.post("/workout-plans", data);
    return response.data;
}

const deleteWorkoutPlan = async (id) => {
    const response = await api.delete(`/workout-plans/${id}`);
    return response.data;
}

const getMemberWorkouts = async (memberId) => {
    const response = await api.get(`/workout-plans/member/${memberId}`);
    return response.data;
}

const getWorkoutPlanById = async (id) => {
    const response = await api.get(`/workout-plans/${id}`);
    return response.data;
}

const updateWorkoutPlan = async (id, data) => {
    const response = await api.put(`/workout-plans/${id}`);
    return response.data;
}

const workoutService = { createWorkOutPlan, deleteWorkoutPlan, getMemberWorkouts, getWorkoutPlanById, updateWorkoutPlan};

export default workoutService;