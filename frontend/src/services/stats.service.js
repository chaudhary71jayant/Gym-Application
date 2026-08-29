import api from "./api";

const getAdminStats = async () => {
    const response = await api.get("/stats/admin");
    return response.data;
}

const statsService = { getAdminStats };

export default statsService;
