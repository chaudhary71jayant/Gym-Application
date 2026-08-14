import api from "./api.js";

const createDietPlan = async (data) => {
    const response = await api.post("/diet-plans", data);
    return response.data;
}

const getPlanById = async (id) => {
    const response = await api.get(`/diet-plans/${id}`);
    return response.data;
}

const getMemberDiet = async (memberId) => {
    const response = await api.get(`/diet-plans/member/${memberId}`);
    return response.data;
}

const updateDietPlan = async (id, data) => {
    const response = await api.put(`/diet-plans/${id}`,data);
    return response.data;
}

const deleteDietPlan = async (id) => {
    const response = await api.delete(`/diet-plans/${id}`);
    return response.data;
}

const dietplanServices = { createDietPlan, getPlanById, getMemberDiet, updateDietPlan, deleteDietPlan};

export default dietplanServices;