// src/events/router/events.router.js
import { Router } from "express";

// 하위 라우터 (절대경로 금지: 내부에서 '/' 기준으로만 정의)
import eventRouter from "../event/router/event.router.js"; // GET /, GET/PUT/DELETE /:eventId
import creationRouter from "../creation/router/creation.router.js"; // POST /
import applicationRouter from "../application/router/application.router.js"; // /:eventId/applications 등
import restaurantsRouter from "../../restaurants/router/restaurants.router.js";
import commentsRouter from "../comments/router/comments.router.js";

// ✅ 추가: 내가 신청한 밥약 컨트롤러
import { myApplications } from "../application/controller/application.controller.js";

const r = Router();

/* ───────── 공통 로그 ───────── */
r.use((req, _res, next) => {
  console.log("[EVENTS] hit", req.method, req.originalUrl);
  next();
});

/* ───────── 헬스체크 ───────── */
r.get("/_ping", (_req, res) => res.json({ ok: true, where: "/api/events" }));

/* ───────── 프리플라이트/HEAD & CORS ─────────
   credentials=true 를 쓰므로 '*' 대신 요청 Origin을 반사 (prod에선 화이트리스트 권장)
*/
r.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
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

/* ───────── 동적 인증 미들웨어 (+개발 우회) ───────── */
let _authFn = null;
async function authMw(req, res, next) {
  try {
    // 개발 우회 (배포 금지)
    if (
      process.env.SKIP_AUTH === "1" &&
      process.env.NODE_ENV !== "production"
    ) {
      req.user = { id: 1, isCompleted: true, nickname: "tester1" };
      return next();
    }

    // 실제 인증 미들웨어 동적 로딩
    if (!_authFn) {
      const mod = await import("../../auth/middleware/auth.middleware.js");
      const base = mod.authenticateAccessToken || mod.auth || mod.default;
      if (typeof base !== "function") {
        const err = new Error("Auth middleware not found");
        err.status = 500;
        return next(err);
      }
      _authFn = base;
    }

    return _authFn(req, res, next);
  } catch (e) {
    next(e);
  }
}

/* ───────── 개별 라우트 (특수 경로는 먼저 선언!) ─────────
   ⚠️ '/:eventId' 같은 패턴보다 '/me'를 위에 둬야 함
*/
r.get("/me", authMw, myApplications); // ✅ 내가 신청한 밥약

/* ───────── 하위 라우터 마운트 ───────── */
r.use("/", applicationRouter); // 신청 관련 경로들 (/applications/* 등)
r.use("/", creationRouter); // 'POST /'
r.use("/", eventRouter); // '/', '/:eventId'
r.use("/restaurants", restaurantsRouter);
r.use("/:eventId/comments", commentsRouter); // commentsRouter는 Router({ mergeParams: true }) 필수

/* ───────── 서브 라우터 404 ───────── */
r.use((req, res) => {
  res
    .status(404)
    .json({ ok: false, error: "NOT_FOUND", path: req.originalUrl });
});

export default r;
