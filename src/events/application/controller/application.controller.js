import { StatusCodes } from "http-status-codes";
import { apply, cancel, mine } from "../service/application.service.js";

/** 공통 실패 응답 헬퍼 */
function fail(res, status, errorCode, reason, data = null) {
  return res.status(status).json({
    resultType: "FAIL",
    error: { errorCode, reason, data },
    success: null,
  });
}

/** 숫자형 경로 파라미터 파싱 */
function parseId(raw, name = "id") {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    const err = new Error(`INVALID_${name.toUpperCase()}`);
    err.status = StatusCodes.BAD_REQUEST;
    err.code = `INVALID_${name.toUpperCase()}`;
    throw err;
  }
  return n;
}

// ───────── 신청 생성 ─────────
export const applyApplication = async (req, res, next) => {
  try {
    const eventId = parseId(req.params.eventId, "event_id");
    const application = await apply(eventId, req.user);

    if (typeof res.success === "function") {
      return res.success(application, StatusCodes.CREATED);
    }
    return res.status(StatusCodes.CREATED).json({
      resultType: "SUCCESS",
      error: null,
      success: application,
    });
  } catch (e) {
    const code = e?.code || e?.message;
    if (code === "EVENT_NOT_FOUND") {
      return fail(
        res,
        StatusCodes.NOT_FOUND,
        "EVENT_NOT_FOUND",
        "EVENT_NOT_FOUND",
      );
    }
    if (code === "UNAUTHORIZED") {
      return fail(
        res,
        StatusCodes.UNAUTHORIZED,
        "UNAUTHORIZED",
        "UNAUTHORIZED",
      );
    }
    if (code === "CANNOT_APPLY_OWN_EVENT") {
      return fail(
        res,
        StatusCodes.BAD_REQUEST,
        "CANNOT_APPLY_OWN_EVENT",
        "CANNOT_APPLY_OWN_EVENT",
      );
    }
    if (
      e?.code?.startsWith?.("INVALID_") ||
      e?.status === StatusCodes.BAD_REQUEST
    ) {
      return fail(
        res,
        StatusCodes.BAD_REQUEST,
        e.code ?? "BAD_REQUEST",
        e.message ?? "BAD_REQUEST",
      );
    }
    next(e);
  }
};

// ───────── 신청 취소 ─────────
export const cancelApplication = async (req, res, next) => {
  try {
    const eventId = parseId(req.params.eventId, "event_id");
    const creatorIdRaw = req.params.creatorId;
    const creatorId =
      creatorIdRaw === undefined || creatorIdRaw === "me"
        ? "me"
        : parseId(creatorIdRaw, "creator_id");

    const result = await cancel(eventId, creatorId, req.user);

    if (typeof res.success === "function") {
      return res.success(result, StatusCodes.OK);
    }
    return res.status(StatusCodes.OK).json({
      resultType: "SUCCESS",
      error: null,
      success: result,
    });
  } catch (e) {
    // ... (기존 분기 그대로)
    next(e);
  }
};
// ───────── 내 신청 목록 ─────────
export const myApplications = async (req, res, next) => {
  try {
    const applications = await mine(req.user, req.query);

    if (typeof res.success === "function") {
      return res.success(applications, StatusCodes.OK);
    }
    return res.status(StatusCodes.OK).json({
      resultType: "SUCCESS",
      error: null,
      success: applications,
    });
  } catch (e) {
    if (e?.message === "UNAUTHORIZED") {
      return fail(
        res,
        StatusCodes.UNAUTHORIZED,
        "UNAUTHORIZED",
        "UNAUTHORIZED",
      );
    }
    if (
      e?.code?.startsWith?.("INVALID_") ||
      e?.status === StatusCodes.BAD_REQUEST
    ) {
      return fail(
        res,
        StatusCodes.BAD_REQUEST,
        e.code ?? "BAD_REQUEST",
        e.message ?? "BAD_REQUEST",
      );
    }
    next(e);
  }
};
