// src/events/router/events.router.js
import { Router } from "express";

// 하위 라우터 (절대경로 금지: 내부에서 '/' 기준으로만 정의)
import eventRouter from "../event/router/event.router.js"; // GET /, GET/PUT/PATCH/DELETE /:eventId
import creationRouter from "../creation/router/creation.router.js"; // POST /
import applicationRouter from "../application/router/application.router.js"; // /:eventId/application 등
import restaurantsRouter from "../../restaurants/router/restaurants.router.js";
import commentsRouter from "../comments/router/comments.router.js"; // Router({ mergeParams: true }) 필수

const r = Router();

/* 헬스체크 */
r.get("/_ping", (_req, res) => res.json({ ok: true, where: "/api/events" }));

/* CORS & 프리플라이트/HEAD 공통 처리 */
r.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // 필요시 특정 Origin으로 제한
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );

  if (req.method === "OPTIONS") return res.sendStatus(204);
  if (req.method === "HEAD") return res.sendStatus(200);
  next();
});

/* 공통 로그 */
r.use((req, _res, next) => {
  console.log("[EVENTS]", req.method, req.originalUrl);
  next();
});

/* 하위 라우터 마운트 (상대 경로만) */
r.use("/", eventRouter); // '/', '/:eventId'
r.use("/", applicationRouter); // 신청 관련 경로들
r.use("/", creationRouter); // 'POST /'
r.use("/restaurants", restaurantsRouter);
r.use("/:eventId/comments", commentsRouter); // commentsRouter는 Router({ mergeParams: true }) 필수

/* 서브 라우터 404 (해당 prefix 내에서만) */
r.use((req, res) => {
  res
    .status(404)
    .json({ ok: false, error: "NOT_FOUND", path: req.originalUrl });
});

export default r;
