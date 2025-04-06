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
  getTotalItemCount,
  getRecentAddedItems,
  getInstanceDetails,
  updateItem, // Add this import
} from "../controllers/item.controller.js";

const router = express.Router();

router.get(
  "/:itemId/instances/:serialNumber",
  protectRoute,
  getInstanceDetails
);
router.put("/instances/:serialNumber", protectRoute, adminOnly, updateStatus);
router.post("/:itemId/allocate", protectRoute, allocateItem);
router.post("/instances/:serialForReturn/return", protectRoute, returnItem);
router.get("/recent/:count", protectRoute, getRecentAddedItems);
router.get("/total", protectRoute, getTotalItemCount);
router.post("/add", protectRoute, adminOnly, addNewItem);
router.get("/grouped-by-status", item_by_status);
router.get("/grouped-by-category", item_by_category);
router.post("/inc/:id", protectRoute, adminOnly, incrementInstances);
// Add the missing update route
router.post("/:id/update", protectRoute, adminOnly, updateItem);
router.get("/", protectRoute, getAllItems);
router.get("/:id", protectRoute, getItem);

export default router;
