import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']); 
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from 'cookie-parser';
import connectdb from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import memberRoutes from "./src/routes/member.routes.js";
import trainerRoutes from "./src/routes/trainer.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import assignmentRoutes from "./src/routes/assignment.routes.js";
import attendanceRoutes from "./src/routes/attendance.routes.js";
import dietPlanRoutes from "./src/routes/dietPlan.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import workoutPlanRoutes from "./src/routes/workoutplan.routes.js";
import statsRoutes from "./src/routes/stats.routes.js";
import errorHandler from "./src/middlewares/errorhandler.js";
import initScheduledJobs from "./src/jobs/schedule.jobs.js";


dotenv.config();

connectdb();

const app = express();

app.use(cors({
    origin : "http://localhost:5173", //Message : I will change this when i will deploy the application.
    credentials : true,
}));
app.use(express.json());
app.use(cookieParser());

const PORT = Number(process.env.PORT) || 8080;



app.get('/', (req, res) => {
    res.send("Hello server is listening");
});



app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/member", memberRoutes);
app.use("/api/v1/trainer", trainerRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/diet-plans", dietPlanRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/workout-plans", workoutPlanRoutes);
app.use("/api/v1/stats", statsRoutes);

app.use(errorHandler);

initScheduledJobs();

app.listen(PORT, () => {
    console.log(`The app is listening at ${PORT}`);
});
