import express from "express";
import {
  category_list,
  create_category,
  update_category,
  delete_category,
  fetch_category,
} from "../controllers/category.controller.js";
import { adminOnly, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/categories", protectRoute, category_list);
router.get("/get/:categoryId", protectRoute, fetch_category);
router.post("/create", protectRoute, adminOnly, create_category);
router.post("/:categoryId/update", protectRoute, adminOnly, update_category);
router.post("/:categoryId/delete", protectRoute, adminOnly, delete_category);

export default router;
