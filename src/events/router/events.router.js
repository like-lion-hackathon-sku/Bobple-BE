// 위치: src/events/router/events.router.js
import { Router } from "express";

// 하위 라우터 (절대경로 금지: 내부에서 '/' 기준으로만 정의)
import eventRouter from "../event/router/event.router.js"; // GET /, GET/PUT/DELETE /:eventId
import creationRouter from "../creation/router/creation.router.js"; // POST /
import applicationRouter from "../application/router/application.router.js"; // /:eventId/application 등
import restaurantsRouter from "../../restaurants/router/restaurants.router.js";
import commentsRouter from "../comments/router/comments.router.js";

const r = Router();

// 프리플라이트/HEAD 공통 미들웨어 (경로 없이 메서드로만 처리)
r.use((req, res, next) => {
  // 필요하면 특정 Origin으로 제한
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  if (req.method === "HEAD") {
    return res.sendStatus(200);
  }
  next();
});

// 하위 라우터 마운트 (상대 경로만)
r.use("/", applicationRouter);
r.use("/", eventRouter);
r.use("/", creationRouter);
r.use("/restaurants", restaurantsRouter);
r.use("/:eventId/comments", commentsRouter);

/*
  404 Not Found 핸들러
  위의 라우터 마운트 외의 요청은 여기를 통해 "404 Not Found"가 나오게 했어용
*/
r.use((req, res) => {
  res
    .status(404)
    .json({ ok: false, error: "NOT_FOUND", path: req.originalUrl });
});

export default r;
