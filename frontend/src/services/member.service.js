import api from "./api.js";

const getAllMembers = async() => {
    const response = await api.get("/member");
    return response.data;
}

const getMyMemberProfile = async () => {
    const response = await api.get("/member/me");
    return response.data;
}

const getMemberById = async (id) => {
    const response = await api.post(`/member/${id}`);
    return response.data;
}

const updateMember = async ( id, data) => {
    const response = await api.put(`/member/${id}`, data);
    return response.data;
}

const deleteMember = async ( id) => {
    const response = await api.delete(`/member/${id}`);
    return response.data;
}

const updateMembershipStatus = async (id, status) => {
    const response = await api.put(`/member/${id}/membership-status`, status);
    return response.data;
}

const memberService = { getAllMembers, getMyMemberProfile, getMemberById, updateMember, deleteMember, updateMembershipStatus };

export default memberService;