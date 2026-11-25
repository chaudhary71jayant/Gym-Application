import api from "./api.js";

const assignTrainer = async (memberId, trainerId) => {
  const response = await api.post("/assignments/assign", {
    memberId,
    trainerId,
  });
  return response.data;
};

const unassignTrainer = async (memberId) => {
  const response = await api.post("/assignments/unassign", { memberId });
  return response.data;
};

const getTrainerAssignments = async (trainerId) => {
  const response = await api.get(`/assignments/trainer/${trainerId}`);
  return response.data;
};

const getMemberAssignment = async (memberId) => {
  const response = await api.get(`/assignments/member/${memberId}`);
  return response.data;
};

const assignmentsService = {
  assignTrainer,
  unassignTrainer,
  getTrainerAssignments,
  getMemberAssignment,
};

export default assignmentsService;
