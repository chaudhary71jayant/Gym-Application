import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']); 
import express from "express";
import dotenv from "dotenv";
import connectdb from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import memberRoutes from "./src/routes/member.routes.js";
import trainerRoutes from "./src/routes/trainer.routes.js";
import userRoutes from "./src/routes/user.routes.js";

dotenv.config();

connectdb();

const app = express();
app.use(express.json());
const PORT = Number(process.env.PORT) || 8080;

app.get('/', (req, res) => {
    res.send("Hello server is listening");
});



app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/member", memberRoutes);
app.use("/api/v1/trainer", trainerRoutes);
app.use("/api/v1/user", userRoutes);

//centralized error handler
app.use((err,req,res,next) => {
    console.error("Error stack : ", err.stack);

    res.statusCode(err.status || 500).json({
        success : false,
        message : err.message || "Internal server Error",
    });
})

app.listen(PORT, () => {
    console.log(`The app is listening at ${PORT}`);
});