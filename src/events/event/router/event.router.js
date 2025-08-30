// src/events/event/router/event.router.js
import { Router } from "express";
import { list, detail, edit, cancel } from "../service/event.service.js";

const r = Router();

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
  // ... 생략 (기존 코드 동일)
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
 *         schema: { type: integer, default: 1 }
 *         description: 페이지 번호
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 12, maximum: 50 }
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
 */
r.get("/", async (req, res, next) => {
  // ...
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
 *       404:
 *         description: 이벤트를 찾을 수 없음
 */
r.get("/:eventId", onlyDigits404, async (req, res, next) => {
  // ...
});

/* ───────── 수정 ───────── */
/**
 * @swagger
 * /api/events/{eventId}/edit:
 *   put:
 *     tags: [Events]
 *     summary: 이벤트 수정
 *     security:
 *       - bearerAuth: []
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
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 이벤트 없음
 */
r.put("/:eventId/edit", onlyDigits404, authMw, async (req, res, next) => {
  // ...
});

/* ───────── 삭제(취소) ───────── */
/**
 * @swagger
 * /api/events/{eventId}/cancel:
 *   delete:
 *     tags: [Events]
 *     summary: 이벤트 삭제(취소)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 취소 성공
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 이벤트 없음
 */
r.delete("/:eventId/cancel", onlyDigits404, authMw, async (req, res, next) => {
  // ...
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
 *   delete:
 *     tags: [Events]
 *     summary: (호환용) 이벤트 삭제
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: integer }
 */
r.patch("/:eventId", onlyDigits404, authMw, async (req, res, next) => {
  // ...
});

r.delete("/:eventId", onlyDigits404, authMw, async (req, res, next) => {
  // ...
});

export default r;
