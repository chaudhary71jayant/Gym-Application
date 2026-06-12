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

app.listen(PORT, () => {
    console.log("The app is listening at localhost 3000");
});