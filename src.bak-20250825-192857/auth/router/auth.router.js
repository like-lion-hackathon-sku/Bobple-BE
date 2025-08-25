import express from "express";
import {
  handleLogin,
  handleLogout,
  handleRefresh,
  handleUpdateProfile,
} from "../controller/auth.controller.js";
import multer from "multer";
import { authenticateAccessToken } from "../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage() });
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.post("/refresh", handleRefresh);
router.put(
  "/profile",
  upload.single("profileImage"),
  authenticateAccessToken,
  handleUpdateProfile,
);
export default router;
