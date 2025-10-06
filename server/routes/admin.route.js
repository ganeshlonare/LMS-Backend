import { Router } from "express";
import { isUserLoggedIn, isAuthorized } from "../middlewares/authMiddleware.js";
import { getUserStats } from "../controllers/admin.controller.js";

const router = Router();

// GET /admin/stats/users
router.get(
  "/stats/users",
  isUserLoggedIn,
  isAuthorized("ADMIN"),
  getUserStats
);

export default router;