import api from "./api.js";

const register = async ( userData ) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
}

const login = async( credentials ) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
}

const logout = async() => {
    const response = await api.post("/auth/logout");
    return response.data;
}

const changePassword = async ( passwordData ) =>{
    const response = await api.put("/auth/change-password");
    return response.data;
}

const authService = { register, login, logout, changePassword };

export default authService;