import express from "express";
import { adminOnly, protectRoute } from "../middleware/auth.middleware.js";
import {
  addNewItem,
  getAllItems,
  getItem,
  incrementInstances,
  item_by_status,
  item_by_category,
  updateStatus,
  allocateItem,
  returnItem,
} from "../controllers/item.controller.js";

const router = express.Router();

router.put("/instances/:serialNumber", protectRoute, adminOnly, updateStatus);
router.post("/:itemId/allocate", protectRoute, adminOnly, allocateItem);
router.post(
  "/instances/:serialForReturn/return",
  protectRoute,
  adminOnly,
  returnItem
);
router.post("/add", protectRoute, adminOnly, addNewItem);
router.get("/grouped-by-status", item_by_status);
router.get("/grouped-by-category", item_by_category);
router.post("/inc/:id", protectRoute, adminOnly, incrementInstances);
router.get("/", protectRoute, getAllItems);
router.get("/:id", protectRoute, getItem);

export default router;
