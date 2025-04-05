import express from "express";
import {
  login,
  logout,
  signup,
  getProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

// router.use((req, res, next) => {
//   console.log(req.method);
//   next();
// });
router.post("/login", login);
router.post("/signup", signup);
router.post("/logout", logout);
router.get("/profile", protectRoute, getProfile);

export default router;
