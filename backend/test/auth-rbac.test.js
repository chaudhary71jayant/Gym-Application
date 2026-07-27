import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import authRoutes from "../src/routes/auth.routes.js";
import authMiddleware from "../src/middlewares/authmiddleware.js";
import authorize from "../src/middlewares/rolemiddleware.js";
import errorHandler from "../src/middlewares/errorhandler.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);
app.get("/protected/admin", authMiddleware, authorize("admin"), (req, res) => res.json({ success: true }));
app.get("/error", () => {
    throw new Error("expected test error");
});
app.use(errorHandler);

let server;
let baseUrl;

before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve) => server.close(resolve));
});

const request = (path, options = {}) => fetch(`${baseUrl}${path}`, options);

test("rejects incomplete login requests", async () => {
    const response = await request("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
    });
    assert.equal(response.status, 400);
});

test("rejects missing and malformed tokens", async () => {
    assert.equal((await request("/protected/admin")).status, 401);
    assert.equal((await request("/protected/admin", { headers: { Authorization: "Bearer malformed" } })).status, 401);
});

test("enforces roles and allows an authorized role", async () => {
    const memberToken = jwt.sign({ id: "507f1f77bcf86cd799439012", role: "member" }, process.env.JWT_SECRET_KEY, { expiresIn: "5m" });
    const adminToken = jwt.sign({ id: "507f1f77bcf86cd799439011", role: "admin" }, process.env.JWT_SECRET_KEY, { expiresIn: "5m" });
    assert.equal((await request("/protected/admin", { headers: { Authorization: `Bearer ${memberToken}` } })).status, 403);
    assert.equal((await request("/protected/admin", { headers: { Authorization: `Bearer ${adminToken}` } })).status, 200);
});

test("formats unhandled errors as JSON", async () => {
    const response = await request("/error");
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { success: false, message: "expected test error" });
});
