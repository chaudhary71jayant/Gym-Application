import api from "./api.js";

const getMyProfile = async () => {
  const response = await api.get("/user/me");
  return response.data;
};

const updateMyProfile = async (data) => {
  const response = await api.put("/user/me", data);
  return response.data;
};

const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.put("/user/me/profile-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const getAllAdmins = async () => {
  const response = await api.get("/user/admin");
  return response.data;
};

const createAdmin = async (data) => {
  const response = await api.post("/user/create-admin", data);
  return response.data;
};

const deleteAdmin = async (id) => {
  const response = await api.delete(`/user/${id}/delete-admin`);
  return response.data;
};

const getAllUsers = async (role) => {
  const params = role ? `?role=${role}` : "";
  const response = await api.get(`/user${params}`);
  return response.data;
};

const getUserById = async (id) => {
  const response = await api.get(`/user/${id}`);
  return response.data;
};

const updateUserStatus = async (id, isActive) => {
  const response = await api.put(`/user/${id}/status`, { isActive });
  return response.data;
};

const deleteUser = async (id) => {
  const response = await api.delete(`/user/${id}`);
  return response.data;
};

const userService = {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  getAllAdmins,
  createAdmin,
  deleteAdmin,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
};

export default userService;
