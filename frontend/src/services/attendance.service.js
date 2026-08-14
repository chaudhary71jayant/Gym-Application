import api from "./api.js";

const checkIn = async () => {
  const response = await api.post("/attendance/checkin");
  return response.data;
};

const checkOut = async () => {
  const response = await api.put("/attendance/checkout");
  return response.data;
};

const getMemberAttendance = async (memberId, month, year) => {
  const params = month && year ? `?month=${month}&year=${year}` : "";
  const response = await api.get(`/attendance/member/${memberId}${params}`);
  return response.data;
};

const getTodayAttendance = async () => {
  const response = await api.get("/attendance/today");
  return response.data;
};

const attendanceService = { checkIn, checkOut, getMemberAttendance, getTodayAttendance };

export default attendanceService;