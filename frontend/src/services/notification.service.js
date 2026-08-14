import api from "./api.js";

const getMyNotifications = async (unread) => {
  const params = unread ? "?unread=true" : "";
  const response = await api.get(`/notifications${params}`);
  return response.data;
};

const markAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

const markAllAsRead = async () => {
  const response = await api.put("/notifications/read-all");
  return response.data;
};

const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

const notificationService = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };

export default notificationService;