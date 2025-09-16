// src/events/creation/router/creation.router.js
import { Router } from "express";
import { createEvent } from "../controller/creation.controller.js";

const router = Router();

/* 인증 동적로딩 + 개발우회 */
/* 인증 동적로딩 + 개발우회 */
let _authFn = null;
async function authMw(req, res, next) {
  try {
    // ✅ 프로덕션 강제 차단: 실수로 우회 켜고 배포하면 서버가 뜨지 않게
    if (
      process.env.NODE_ENV === "production" &&
      process.env.SKIP_AUTH === "1"
    ) {
      const err = new Error("SKIP_AUTH must not be enabled in production");
      err.status = 500;
      return next(err); // 또는 process.exit(1) 을 서버 부팅 시점에 적용
    }

    // ✅ 개발 환경에서만 우회 허용
    if (
      process.env.SKIP_AUTH === "1" &&
      process.env.NODE_ENV !== "production"
    ) {
      if (!req.user) {
        // 필요시 .env 에서 DEV_FAKE_USER_ID 로 바꿀 수 있게
        const fakeId = Number(process.env.DEV_FAKE_USER_ID || 1);
        req.user = {
          id: fakeId,
          isCompleted: true,
          nickname: "tester" + fakeId,
        };
        // 선택: 한 번만 경고 로그
        if (!global.__authBypassWarned) {
          console.warn("[WARN] Auth bypass enabled (SKIP_AUTH=1) — dev only");
          global.__authBypassWarned = true;
        }
      }
      return next();
    }

    // ✅ 실제 인증 미들웨어 동적 로딩
    if (!_authFn) {
      const mod = await import("../../../auth/middleware/auth.middleware.js");
      const base = mod.authenticateAccessToken || mod.auth || mod.default;
      if (typeof base !== "function") {
        const err = new Error("AUTH_MIDDLEWARE_NOT_FOUND");
        err.status = 500;
        throw err;
      }
      _authFn = base;
    }

    return _authFn(req, res, (err) => {
      if (err) return next(err);

      // auth.middleware.js 가 req.payload만 채우는 구조라면 user로 매핑
      if (!req.user && req.payload) {
        const p = req.payload;
        // payload 구조에 맞게 매핑 (예: { id, isCompleted, nickname } 등)
        req.user = (p?.user || p) ?? null;
        if (!req.user?.id) {
          const e = new Error("UNAUTHORIZED");
          e.status = 401;
          return next(e);
        }
      }
      next();
    });
  } catch (e) {
    next(e);
  }
}

/*
  #swagger.tags = ['Events']
  #swagger.summary = '밥약 생성'
  #swagger.description = 'ISO 날짜 예: 2025-08-26T12:00:00.000Z'
  #swagger.security = [{ bearerAuth: [] }]

  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["title", "restaurantId", "startAt", "endAt"],
          properties: {
            title:         { type: "string",  example: "테스트 이벤트" },
            content:       { type: "string",  example: "설명" },
            restaurantId:  { type: "integer", example: 1 },
            startAt:       { type: "string",  format: "date-time", example: "2025-08-26T12:00:00.000Z" },
            endAt:         { type: "string",  format: "date-time", example: "2025-08-26T13:00:00.000Z" },
            maxParticipants:{ type:"integer", example: 4, description: "옵션(응답만)" }
          },
          additionalProperties: false
        }
      }
    }
  }

  #swagger.responses[201] = {
    description: '생성 성공',
    content: {"application/json": {schema: {example: {
      resultType: "SUCCESS",
      error: null,
      success: { id: 18, creatorId: 1, title: "테스트 이벤트", startAt: "2025-08-26T12:00:00.000Z", endAt: "2025-08-26T13:00:00.000Z" }
    }}}}
  }
  #swagger.responses[400] = { description: "검증 실패" }
  #swagger.responses[401] = { description: "인증 필요" }
*/
router.post("/creation", authMw, createEvent); // 최종: POST /api/events/creation

export default router;
