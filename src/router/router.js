// src/router/router.js
import express from "express";
import authRouter from "../auth/router/auth.router.js";
import chatsRouter from "../chats/router/chats.router.js";
import eventsRouter from "../events/router/events.router.js";
import restaurantsRouter from "../restaurants/router/restaurants.router.js";
import reviewsRouter from "../reviews/router/reviews.router.js";
import usersRouter from "../users/router/users.router.js";
import notificationsRouter from "../notifications/router/notifications.router.js";

const router = express.Router({ mergeParams: true });

// 부팅 시 라우트 마운트 로그 (배포 로그 확인용)
console.log(
  "[BOOT] mount routers: /api/auth, /api/chats, /api/events, /api/restaurants, /api/reviews, /api/users, /api/notifications",
);

// ★ 최상위에서만 prefix 부여
router.use("/api/auth", authRouter);
router.use("/api/chats", chatsRouter);
router.use("/api/events", eventsRouter); // events 하위의 event/creation/application 라우터들이 여기로 붙음
router.use("/api/restaurants", restaurantsRouter);
router.use("/api/reviews", reviewsRouter);
router.use("/api/users", usersRouter);
router.use("/api/notifications", notificationsRouter);

// 선택: 전체 API 헬스 체크
router.get("/api/_ping", (_req, res) =>
  res.json({ ok: true, where: "top-level router" }),
);

export default router;
