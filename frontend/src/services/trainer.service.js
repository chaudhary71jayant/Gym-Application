import api from "./api.js";

const createTrainer = async (data) => {
    const response = await api.post("/trainer", data);
    return response.data;
}

const getAllTrainers = async ()=> {
    const response = await api.get("/trainer");
    return response.data;
}

const getTrainerById = async (id) => {
    const response = await api.get(`/trainer/${id}`);
    return response.data;
}

const getAssignedMembers = async (id) => {
    const response = await api.get(`/trainer/${id}/members`);
    return response.data;
}

const updateTrainer = async ( id, data ) => {
    const response = await api.put(`/trainer/${id}`, data);
    return response.data;
}

const deleteTrainer = async (id) => {
    const response = await api.put(`/trainer/${id}`);
    return response.data;
}

const trainerService = { createTrainer, getAllTrainers, getTrainerById, getAssignedMembers, updateTrainer, deleteTrainer };

export default trainerService;