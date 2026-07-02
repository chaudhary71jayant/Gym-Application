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
const PORT = Number(process.env.PORT) || 8080;

app.get('/', (req, res) => {
    res.send("Hello server is listening");
});

app.use(express.json());

app.use("api/v1/auth", authRoutes)
app.use("api/v1/member", memberRoutes);
app.use("api/v1/trainer", trainerRoutes);
app.use("api/v1/user", userRoutes);

//centralized error handler
app.use((err,req,res,next) => {
    console.error("Error stack : ", err.stack);

    res.status(err.status || 500).json({
        success : false,
        message : err.message || "Internal server Error",
    });
})

app.listen(PORT, () => {
    console.log("The app is listening at localhost 3000");
});