import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  getUsageLogs, 
  getUserBorrowedItems,
  getUserReturnedItems 
} from "../controllers/usage.controller.js";

const router = express.Router();

router.get("/usage-logs", protectRoute, getUsageLogs);
router.get("/borrowed-items", protectRoute, getUserBorrowedItems);
router.get("/returned-items", protectRoute, getUserReturnedItems);

export default router;
