// src/events/event/router/event.router.js
import { Router } from "express";
import { list, detail, edit, cancel } from "../service/event.service.js";

const r = Router();

/* ───────────────── Swagger 공통 컴포넌트(선택) ─────────────────
   다른 파일에 이미 선언돼 있다면 생략 가능
  #swagger.components = {
    securitySchemes: {
      bearerAuth: {
        type: 'http', scheme: 'bearer', bearerFormat: 'JWT'
      }
    },
    schemas: {
      EventItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: '9/1 점심 밥약' },
          content: { type: 'string', example: '그린테이블에서 식사' },
          restaurantId: { type: 'integer', example: 55 },
          creatorId: { type: 'integer', example: 2 },
          start_at: { type: 'string', format: 'date-time', example: '2025-09-01T12:00:00.000Z' },
          end_at:   { type: 'string', format: 'date-time', example: '2025-09-01T13:00:00.000Z' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      EventListSuccess: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: '#/components/schemas/EventItem' } },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer', example: 1 },
                  size: { type: 'integer', example: 12 },
                  total: { type: 'integer', example: 123 },
                  totalPages: { type: 'integer', example: 11 },
                  hasNext: { type: 'boolean', example: true },
                  hasPrev: { type: 'boolean', example: false }
                }
              }
            }
          }
        }
      },
      EventDetailSuccess: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          data: { type: 'object', properties: { item: { $ref: '#/components/schemas/EventItem' } } }
        }
      },
      EventUpdatedSuccess: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          data: { type: 'object', properties: { item: { $ref: '#/components/schemas/EventItem' } } }
        }
      },
      CommonError: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          error: { oneOf: [
            { type: 'string', example: 'NOT_FOUND' },
            { type: 'string', example: 'FORBIDDEN' }
          ] }
        }
      }
    }
  }
-----------------------------------------------------------------*/

/* ───────── 공용 유틸 ───────── */
function onlyDigits404(req, res, next) {
  const { eventId } = req.params;
  if (eventId !== undefined && !/^\d+$/.test(String(eventId))) {
    return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  }
  next();
}

/* 인증 미들웨어 (개발 우회 지원) */
let _authFn = null;
async function authMw(req, res, next) {
  try {
    // 프로덕션에서 우회 금지
    if (
      process.env.NODE_ENV === "production" &&
      process.env.SKIP_AUTH === "1"
    ) {
      const err = new Error("SKIP_AUTH must not be enabled in production");
      err.status = 500;
      return next(err);
    }
    // 개발 우회
    if (
      process.env.SKIP_AUTH === "1" &&
      process.env.NODE_ENV !== "production"
    ) {
      if (!req.user) {
        const fakeId = Number(process.env.DEV_FAKE_USER_ID || 1);
        req.user = {
          id: fakeId,
          isCompleted: true,
          nickname: "tester" + fakeId,
        };
        if (!global.__authBypassWarned) {
          console.warn("[WARN] Auth bypass enabled (SKIP_AUTH=1) — dev only");
          global.__authBypassWarned = true;
        }
      }
      return next();
    }
    // 실제 인증 로딩
    if (!_authFn) {
      const mod = await import("../../../auth/middleware/auth.middleware.js");
      _authFn = mod.authenticateAccessToken || mod.auth || mod.default;
      if (typeof _authFn !== "function") {
        const e = new Error("AUTH_MIDDLEWARE_NOT_FOUND");
        e.status = 500;
        throw e;
      }
    }
    return _authFn(req, res, (err) => {
      if (err) return next(err);
      if (!req.user && req.payload) {
        const p = req.payload;
        req.user = (p?.user || p) ?? null;
      }
      next();
    });
  } catch (e) {
    next(e);
  }
}

/* ───────── 목록 ───────── */
/**
 * @swagger
 * /api/events:
 *   get:
 *     tags: [Events]
 *     summary: 이벤트 목록 조회
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *         description: 페이지 번호
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 12, minimum: 1, maximum: 50 }
 *         description: 페이지 크기
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: 검색어
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [latest, oldest] }
 *         description: 정렬 방식
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/EventListSuccess' }
 */
r.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
    const sizeOrLimit = req.query.size ?? req.query.limit ?? "12";
    const size = Math.max(1, Math.min(50, parseInt(sizeOrLimit, 10) || 12));
    const search = (req.query.search ?? "").trim();
    const sort = (req.query.sort ?? "latest").trim();

    const result = await list({ page, size, search, sort });

    return res.status(200).json({
      ok: true,
      data: {
        items: result.items,
        pagination: {
          page,
          size,
          total: result.total,
          totalPages: Math.max(1, Math.ceil(result.total / size)),
          hasNext: page * size < result.total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (e) {
    next(e);
  }
});

/* ───────── 상세 ───────── */
/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     tags: [Events]
 *     summary: 이벤트 상세 조회
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/EventDetailSuccess' }
 *       404:
 *         description: 이벤트를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CommonError' }
 */
r.get("/:eventId", onlyDigits404, async (req, res, next) => {
  try {
    const id = Number(req.params.eventId);
    const item = await detail(id);
    return res.status(200).json({ ok: true, data: { item } });
  } catch (e) {
    if (e?.status === 404) {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }
    next(e);
  }
});

/* ───────── 수정 ───────── */
/**
 * @swagger
 * /api/events/{eventId}/edit:
 *   put:
 *     tags: [Events]
 *     summary: 이벤트 수정
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               start_at: { type: string, format: date-time }
 *               end_at: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/EventUpdatedSuccess' }
 *       403:
 *         description: 권한 없음
 *         content: { application/json: { schema: { $ref: '#/components/schemas/CommonError' } } }
 *       404:
 *         description: 이벤트 없음
 *         content: { application/json: { schema: { $ref: '#/components/schemas/CommonError' } } }
 */
r.put("/:eventId/edit", onlyDigits404, authMw, async (req, res, next) => {
  try {
    const id = Number(req.params.eventId);
    const updated = await edit(id, req.body, req.user);
    return res.status(200).json({ ok: true, data: { item: updated } });
  } catch (e) {
    if (e?.status === 403) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    }
    if (e?.status === 404) {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }
    next(e);
  }
});

/* ───────── 삭제(취소) ───────── */
/**
 * @swagger
 * /api/events/{eventId}/cancel:
 *   delete:
 *     tags: [Events]
 *     summary: 이벤트 삭제(취소)
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 취소 성공
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { ok: { type: 'boolean', example: true }, data: { type: 'object' } } }
 *       403:
 *         description: 권한 없음
 *         content: { application/json: { schema: { $ref: '#/components/schemas/CommonError' } } }
 *       404:
 *         description: 이벤트 없음
 *         content: { application/json: { schema: { $ref: '#/components/schemas/CommonError' } } }
 */
r.delete("/:eventId/cancel", onlyDigits404, authMw, async (req, res, next) => {
  try {
    const id = Number(req.params.eventId);
    const result = await cancel(id, req.user);
    return res.status(200).json({ ok: true, data: result });
  } catch (e) {
    if (e?.status === 403) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    }
    if (e?.status === 404) {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }
    next(e);
  }
});

/* ───────── PATCH/DELETE 알리아스 ───────── */
/**
 * @swagger
 * /api/events/{eventId}:
 *   patch:
 *     tags: [Events]
 *     summary: (호환용) 이벤트 수정
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: 수정 성공
 *   delete:
 *     tags: [Events]
 *     summary: (호환용) 이벤트 삭제
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
r.patch("/:eventId", onlyDigits404, authMw, async (req, res, next) => {
  try {
    const id = Number(req.params.eventId);
    const updated = await edit(id, req.body, req.user);
    return res.status(200).json({ ok: true, data: { item: updated } });
  } catch (e) {
    next(e);
  }
});

r.delete("/:eventId", onlyDigits404, authMw, async (req, res, next) => {
  try {
    const id = Number(req.params.eventId);
    const result = await cancel(id, req.user);
    return res.status(200).json({ ok: true, data: result });
  } catch (e) {
    next(e);
  }
});

export default r;
