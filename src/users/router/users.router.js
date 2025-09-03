import express from "express";
import { authenticateAccessToken, verifyUserIsActive } from "../../auth/middleware/auth.middleware.js";
import { getMe, getUserPublic } from "../controller/users.controller.js";

const router = express.Router({ mergeParams: true });

/**
 * GET /api/users/me
 * 내 프로필 조회 (쿠키의 accessToken 필요)
 */
router.get("/me", authenticateAccessToken, verifyUserIsActive, getMe);

/**
 * GET /api/users/:userId
 * 공개 프로필 조회 (비로그인 허용)
 */
router.get("/:userId", getUserPublic);

export default router;
