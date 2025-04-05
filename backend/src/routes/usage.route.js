import express from "express";
import { adminOnly, protectRoute } from "../middleware/auth.middleware.js";
import { getUsageLogs } from "../controllers/usage.controller.js";

const router = express.Router();

router.get("/usage-logs", protectRoute, adminOnly, getUsageLogs);

export default router;
