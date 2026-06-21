import express from "express";
import dotenv from "dotenv";
import connectdb from "./src/config/db.js";

dotenv.config();

connectdb();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.get('/', (req, res) => {
    res.send("Hello server is listening");
});

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