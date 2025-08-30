import express from "express";
import { listChats } from "../controller/chats.controller.js";

const router = express.Router({ mergeParams: true });

/**
 * GET /api/chats/:eventId?page&size
 * 채팅방(=이벤트) 과거 메시지 조회
 */
router.get("/:eventId", listChats);

export default router;
