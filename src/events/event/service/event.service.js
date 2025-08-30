// src/events/event/service/event.service.js
import {
  findByIdWithParticipants,
  findMany,
  countAll,
  updateById,
  deleteById,
  // 필요한 경우: findById, findByIdWithCreatorRestaurant 등 리포에 추가
} from "../repository/event.repository.js";

const buildChatUrl = (ev) => `/chats/event/${ev.id}`;

/** 숫자 가드 */
function toIntSafe(v, def) {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) ? n : def;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/** 레코드 → 공통 출력 형태로 정규화 */
function normalizeEventRow(ev, opts = { includeParticipants: false }) {
  // restaurant
  const restaurantObj = ev?.restaurant
    ? { id: ev.restaurant.id, name: ev.restaurant.name }
    : ev?.restaurants
      ? { id: ev.restaurants.id, name: ev.restaurants.name }
      : null;

  // creator
  const creatorObj = ev?.creator
    ? { id: ev.creator.id, nickname: ev.creator.nickname }
    : ev?.user
      ? { id: ev.user.id, nickname: ev.user.nickname }
      : ev?.users
        ? { id: ev.users.id, nickname: ev.users.nickname }
        : null;

  const restaurantIdCompat =
    restaurantObj?.id ?? ev?.restaurantId ?? ev?.restaurant_id ?? null;
  const creatorIdCompat =
    creatorObj?.id ??
    ev?.creatorId ??
    ev?.userId ??
    ev?.creator_id ??
    ev?.user_id ??
    null;

  const start_at = ev?.startAt ?? ev?.start_at ?? null;
  const end_at = ev?.endAt ?? ev?.end_at ?? null;

  // participants
  let participants = [];
  if (opts.includeParticipants) {
    const participantsSrc =
      ev?.eventApplications || ev?.applications || ev?.participants || [];
    participants = participantsSrc.map((a) => ({
      id: a?.users?.id ?? a?.user?.id ?? a?.userId ?? null,
      nickname: a?.users?.nickname ?? a?.user?.nickname ?? null,
      applicationId: a?.id ?? null,
    }));
  }

  const participants_count = opts.includeParticipants
    ? participants.length
    : (ev?.participants_count ??
      ev?.participantsCount ??
      (Array.isArray(ev?.participants) ? ev.participants.length : 0));

  const base = {
    id: ev.id,
    title: ev.title,
    content: ev?.content ?? null,
    chatUrl: buildChatUrl(ev),

    // 객체 그대로
    creator: creatorObj,
    restaurant: restaurantObj,

    // 호환 평탄 필드(점진 마이그레이션)
    creatorId: creatorIdCompat,
    creator_id: creatorIdCompat,
    restaurantId: restaurantIdCompat,
    restaurant_id: restaurantIdCompat,

    // 날짜/참가자 (snake + camel 동시 제공)
    start_at,
    end_at,
    startAt: start_at,
    endAt: end_at,
    participants_count,
    participantsCount: participants_count,
  };

  if (opts.includeParticipants) {
    base.participants = participants;
  }

  return base;
}

/**
 * 목록 조회
 * - creator/restaurant 객체를 유지해서 FE가 닉네임/장소명을 바로 쓸 수 있게 함
 * - 동시에 구버전 호환을 위해 상위 id 필드도 같이 내려줌
 */
export async function list(q) {
  const pageRaw = q?.page ?? 1;
  const sizeRaw = q?.size ?? q?.limit ?? 12;

  const page = clamp(toIntSafe(pageRaw, 1), 1, 10_000);
  const size = clamp(toIntSafe(sizeRaw, 12), 1, 50);

  const [rows, total] = await Promise.all([
    // ⚠️ repository.findMany(skip, take)는 반드시 creator/restaurant include 보장 권장
    findMany((page - 1) * size, size),
    countAll(),
  ]);

  const items = (rows ?? []).map((ev) =>
    normalizeEventRow(ev, { includeParticipants: false }),
  );

  return {
    items,
    page,
    size,
    total,
    totalPages: Math.max(1, Math.ceil(total / size)),
    hasNext: page * size < total,
    hasPrev: page > 1,
  };
}

/**
 * 상세 조회
 * - 목록과 동일하게 creator/restaurant 객체 + 호환 필드 제공
 * - 참가자 목록 포함
 */
export async function detail(eventId) {
  const id = toIntSafe(eventId, null);
  if (!id) {
    const err = new Error("bad request");
    err.status = 400;
    throw err;
  }

  const ev = await findByIdWithParticipants(id);
  if (!ev) {
    const err = new Error("not found");
    err.status = 404;
    throw err;
  }

  return normalizeEventRow(ev, { includeParticipants: true });
}

/**
 * 수정
 * - 권한 체크는 repository 혹은 여기서 수행 (여기서는 user.id 비교 가정 X, 라우터/서비스 합의에 따름)
 */
export async function edit(eventId, body, user) {
  const id = toIntSafe(eventId, null);
  if (!id) {
    const err = new Error("bad request");
    err.status = 400;
    throw err;
  }
  if (!user?.id) {
    const err = new Error("unauthorized");
    err.status = 401;
    throw err;
  }

  // 업데이트 필드 화이트리스트
  const payload = {};
  if (typeof body?.title === "string") payload.title = body.title.trim();
  if (typeof body?.content === "string") payload.content = body.content;
  if (body?.start_at || body?.startAt)
    payload.startAt = body.start_at ?? body.startAt;
  if (body?.end_at || body?.endAt) payload.endAt = body.end_at ?? body.endAt;
  if (body?.restaurant_id || body?.restaurantId) {
    payload.restaurantId = body.restaurant_id ?? body.restaurantId;
  }

  const updated = await updateById(id, payload, user);
  if (!updated) {
    const err = new Error("not found");
    err.status = 404;
    throw err;
  }
  // repository.updateById에서 권한 불일치 시 403을 던지도록 설계 권장
  return normalizeEventRow(updated, { includeParticipants: false });
}

/**
 * 취소(삭제 동작)
 */
export async function cancel(eventId, user) {
  const id = toIntSafe(eventId, null);
  if (!id) {
    const err = new Error("bad request");
    err.status = 400;
    throw err;
  }
  if (!user?.id) {
    const err = new Error("unauthorized");
    err.status = 401;
    throw err;
  }

  // repository.deleteById는 작성자/관리자 권한 체크 후 403/404를 던지도록 구현 권장
  const result = await deleteById(id, user);
  // result 형식 통일 (라우터에서 그대로 내려주기 쉬움)
  return { deleted: result?.deleted ?? (result ? 1 : 0), id };
}

/* ─────────────────────────────
 * 리포지토리 체크리스트 (권장)
 * - findMany(skip, take):
 *    include: { creator: { select: { id, nickname } }, restaurant: { select: { id, name } } }
 * - findByIdWithParticipants(id):
 *    include: {
 *      creator: { select: { id, nickname } },
 *      restaurant: { select: { id, name } },
 *      eventApplications: { include: { user: { select: { id, nickname } } } } // 네이밍에 맞게
 *    }
 * - updateById(id, payload, user):
 *    작성자 또는 관리자 권한 검증 → 아니면 { status:403 } throw
 * - deleteById(id, user):
 *    동일하게 권한 검증 후 삭제 → { deleted: 1 }
 * ─────────────────────────────
 */
