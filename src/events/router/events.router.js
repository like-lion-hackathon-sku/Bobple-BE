// src/events/router/events.router.js
import { Router } from "express";

import eventRouter from "../event/router/event.router.js";
import creationRouter from "../creation/router/creation.router.js";
import applicationRouter from "../application/router/application.router.js";
import restaurantsRouter from "../../restaurants/router/restaurants.router.js";
import commentsRouter from "../comments/router/comments.router.js";
import { myApplications } from "../application/controller/application.controller.js";

const r = Router();

/* 로그 */
r.use((req, _res, next) => {
  console.log("[EVENTS] hit", req.method, req.originalUrl);
  next();
});

/* 핑 */
r.get("/_ping", (_req, res) => res.json({ ok: true, where: "/api/events" }));

/* CORS/프리플라이트 */
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

/* 인증 동적로딩(+개발 우회) */
let _authFn = null;
async function authMw(req, res, next) {
  try {
    if (
      process.env.SKIP_AUTH === "1" &&
      process.env.NODE_ENV !== "production"
    ) {
      req.user = { id: 1, isCompleted: true, nickname: "tester1" };
      return next();
    }
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

/* 특수 경로는 먼저 */
r.get("/me", authMw, myApplications);

/* 하위 라우터 */
r.use("/", applicationRouter);
r.use("/", creationRouter);
r.use("/", eventRouter);
r.use("/restaurants", restaurantsRouter);
r.use("/:eventId/comments", commentsRouter);

/* 404 */
r.use((req, res) => {
  res
    .status(404)
    .json({ ok: false, error: "NOT_FOUND", path: req.originalUrl });
});

export default r;
