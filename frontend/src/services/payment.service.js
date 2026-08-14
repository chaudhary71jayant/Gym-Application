import api from "./api.js";

const createPayment = async (data) => {
  const response = await api.post("/payments", data);
  return response.data;
};

const getAllPayments = async (status) => {
  const params = status ? `?status=${status}` : "";
  const response = await api.get(`/payments${params}`);
  return response.data;
};

const getMemberPayments = async (memberId) => {
  const response = await api.get(`/payments/member/${memberId}`);
  return response.data;
};

const updatePaymentStatus = async (id, paymentStatus) => {
  const response = await api.put(`/payments/${id}/status`, { paymentStatus });
  return response.data;
};

const paymentService = { createPayment, getAllPayments, getMemberPayments, updatePaymentStatus };

export default paymentService;