import express from "express";
import {
  handleSendChats,
  handleLeaveChat,
  handleListChats,
} from "../controller/chats.controller.js";
import {
  authenticateAccessToken,
  verifyUserIsActive,
} from "../../auth/middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });

// 채팅 메시지 전송
router.post(
  "/:eventId",
  authenticateAccessToken,
  verifyUserIsActive,
  handleSendChats
);

// 채팅 목록 가져오기
router.get("/:eventId", authenticateAccessToken, verifyUserIsActive, handleListChats);

// 채팅방 나가기
router.patch(
  "/:eventId",
  authenticateAccessToken,
  verifyUserIsActive,
  handleLeaveChat
);
export default router;
