// src/events/application/router/application.router.js
import { Router } from "express";
import {
  applyApplication,
  cancelApplication,
  myApplications,
} from "../controller/application.controller.js";
import * as appRepo from "../repository/application.repository.js";
import * as eventRepo from "../../event/repository/event.repository.js";

const r = Router();

/*
  #swagger.components = {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ApplyApplicationSuccess: {
        type: 'object',
        properties: {
          resultType: { type: 'string', example: 'SUCCESS' },
          error: { type: 'null', example: null },
          success: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              eventId: { type: 'integer', example: 1 },
              creatorId: { type: 'integer', example: 2 }
            }
          }
        }
      },
      CommonFail: {
        type: 'object',
        properties: {
          resultType: { type: 'string', example: 'FAIL' },
          error: {
            type: 'object',
            properties: {
              errorCode: { type: 'string', example: 'BAD_REQUEST' },
              reason: { type: 'string', example: 'INVALID_EVENTID' }
            }
          },
          success: { nullable: true, example: null }
        }
      },
      DeleteSuccess: {
        type: 'object',
        properties: {
          resultType: { type: 'string', example: 'SUCCESS' },
          error: { type: 'null', example: null },
          success: {
            type: 'object',
            properties: {
              deleted: { type: 'integer', example: 1 }
            }
          }
        }
      },
      MyApplicationsSuccess: {
        type: 'object',
        properties: {
          resultType: { type: 'string', example: 'SUCCESS' },
          error: { type: 'null', example: null },
          success: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 10 },
                    eventId: { type: 'integer', example: 1 },
                    creatorId: { type: 'integer', example: 2 },
                    createdAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer', example: 1 },
                  take: { type: 'integer', example: 12 }
                }
              }
            }
          }
        }
      }
    }
  }
*/

/* utils */
const onlyDigits400 = (names) => (req, res, next) => {
  for (const n of names) {
    const v = req.params[n];
    if (v !== undefined && !/^\d+$/.test(String(v))) {
      return typeof res.fail === "function"
        ? res.fail(
            { errorCode: "BAD_REQUEST", reason: `INVALID_${n.toUpperCase()}` },
            400,
          )
        : res.status(400).json({
            resultType: "FAIL",
            error: {
              errorCode: "BAD_REQUEST",
              reason: `INVALID_${n.toUpperCase()}`,
            },
            success: null,
          });
    }
  }
  next();
};

/* auth (dev 우회) */
let _authFn = null;
async function authMw(req, res, next) {
  try {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.SKIP_AUTH === "1"
    ) {
      const err = new Error("SKIP_AUTH must not be enabled in production");
      err.status = 500;
      return next(err);
    }
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
      if (!req.user?.id) {
        const e = new Error("UNAUTHORIZED");
        e.status = 401;
        return next(e);
      }
      next();
    });
  } catch (e) {
    next(e);
  }
}

/* ─────────────────────────────────────────────────────────
 * 신청 생성: POST /api/events/:eventId/application
 * ───────────────────────────────────────────────────────── */
/*
  #swagger.tags = ['Applications']
  #swagger.summary = '밥약 신청 생성'
  #swagger.description = '특정 이벤트(eventId)에 대해 인증된 사용자의 신청을 생성합니다.'
  #swagger.security = [{ bearerAuth: [] }]
  #swagger.parameters['eventId'] = {
    in: 'path',
    description: '이벤트 ID',
    required: true,
    schema: { type: 'integer', example: 1 }
  }
  #swagger.requestBody = {
    required: false,
    content: {
      'application/json': {
        schema: { type: 'object', description: '추가 입력이 없다면 비워두세요.' },
        example: {}
      }
    }
  }
  #swagger.responses[201] = {
    description: '신청 성공',
    schema: { $ref: '#/components/schemas/ApplyApplicationSuccess' }
  }
  #swagger.responses[400] = {
    description: '잘못된 요청(경로 파라미터 등)',
    schema: { $ref: '#/components/schemas/CommonFail' }
  }
  #swagger.responses[401] = { description: '인증 실패' }
  #swagger.responses[404] = {
    description: '이벤트가 존재하지 않음',
    schema: { $ref: '#/components/schemas/CommonFail' }
  }
*/
r.post(
  "/:eventId/application",
  onlyDigits400(["eventId"]),
  authMw,
  applyApplication,
);

/* ─────────────────────────────────────────────────────────
 * 신청 취소: DELETE /api/events/:eventId/application/:applicationId/cancel
 * ───────────────────────────────────────────────────────── */
/*
  #swagger.tags = ['Applications']
  #swagger.summary = '밥약 신청 취소'
  #swagger.description = '본인 신청이거나 해당 이벤트의 작성자일 경우, 특정 신청(applicationId)을 취소합니다.'
  #swagger.security = [{ bearerAuth: [] }]
  #swagger.parameters['eventId'] = {
    in: 'path',
    description: '이벤트 ID',
    required: true,
    schema: { type: 'integer', example: 1 }
  }
  #swagger.parameters['applicationId'] = {
    in: 'path',
    description: '신청 ID',
    required: true,
    schema: { type: 'integer', example: 10 }
  }
  #swagger.responses[200] = {
    description: '취소 성공',
    schema: { $ref: '#/components/schemas/DeleteSuccess' }
  }
  #swagger.responses[400] = {
    description: '잘못된 요청(경로 파라미터 등)',
    schema: { $ref: '#/components/schemas/CommonFail' }
  }
  #swagger.responses[401] = { description: '인증 실패' }
  #swagger.responses[403] = {
    description: '권한 없음(본인도 아니고 호스트도 아님)',
    schema: { $ref: '#/components/schemas/CommonFail' }
  }
  #swagger.responses[404] = {
    description: '신청이 존재하지 않거나 eventId와 매칭되지 않음',
    schema: { $ref: '#/components/schemas/CommonFail' }
  }
*/
r.delete(
  "/:eventId/application/:applicationId/cancel",
  onlyDigits400(["eventId", "applicationId"]),
  authMw,
  async (req, res, next) => {
    try {
      const eventId = Number(req.params.eventId);
      const applicationId = Number(req.params.applicationId);

      const app = await appRepo.findById(applicationId);
      if (!app || app.eventId !== eventId) {
        return typeof res.fail === "function"
          ? res.fail(
              {
                errorCode: "APPLICATION_NOT_FOUND",
                reason: "APPLICATION_NOT_FOUND",
              },
              404,
            )
          : res.status(404).json({
              resultType: "FAIL",
              error: {
                errorCode: "APPLICATION_NOT_FOUND",
                reason: "APPLICATION_NOT_FOUND",
              },
              success: null,
            });
      }

      const ev =
        typeof eventRepo.findById === "function"
          ? await eventRepo.findById(eventId)
          : await eventRepo.findByIdWithParticipants(eventId);

      const isHost = ev?.creatorId === req.user.id;
      const isOwner = app.creatorId === req.user.id;
      if (!isHost && !isOwner) {
        return typeof res.fail === "function"
          ? res.fail({ errorCode: "FORBIDDEN", reason: "FORBIDDEN" }, 403)
          : res.status(403).json({
              resultType: "FAIL",
              error: { errorCode: "FORBIDDEN", reason: "FORBIDDEN" },
              success: null,
            });
      }

      await appRepo.deleteById(applicationId);
      return typeof res.success === "function"
        ? res.success({ deleted: 1 }, 200)
        : res.status(200).json({
            resultType: "SUCCESS",
            error: null,
            success: { deleted: 1 },
          });
    } catch (e) {
      next(e);
    }
  },
);

/* ─────────────────────────────────────────────────────────
 * 내가 신청한 목록: GET /api/events/me
 * ───────────────────────────────────────────────────────── */
/*
  #swagger.tags = ['Applications']
  #swagger.summary = '내 신청 목록 조회'
  #swagger.description = '인증된 사용자의 신청 목록을 페이지네이션과 함께 조회합니다.'
  #swagger.security = [{ bearerAuth: [] }]
  #swagger.parameters['page'] = {
    in: 'query',
    description: '페이지 번호(기본 1)',
    required: false,
    schema: { type: 'integer', example: 1 }
  }
  #swagger.parameters['take'] = {
    in: 'query',
    description: '페이지 크기(기본 12)',
    required: false,
    schema: { type: 'integer', example: 12 }
  }
  #swagger.responses[200] = {
    description: '조회 성공',
    schema: { $ref: '#/components/schemas/MyApplicationsSuccess' }
  }
  #swagger.responses[401] = { description: '인증 실패' }
*/
r.get("/me", authMw, myApplications);

export default r;
