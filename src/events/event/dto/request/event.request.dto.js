// 위치 : src/events/event/dto/request/event.request.dto.js

/* 핼퍼 함수
   숫자 변환과 범위 체크
   양의 정수면 그대로, 나머지 값은 기본값(def)으로 반환
*/
const toPosInt = (v, def = 0) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : def;
};

/* 쿼리스트링을 안전하게 반환해주는 함수
   page 최소 1이상(기본1),  size 최소 1이상(기본10)
   잘못된 값 들어오면 기본값으로 반환
*/
export function parseListQuery(query) {
  const page = Math.max(1, toPosInt(query.page, 1));
  const size = Math.min(50, Math.max(1, toPosInt(query.size, 10)));
  return { page, size };
}

/*  /api/events/:eventId 경로의 :eventId 값을 숫자로 파싱 해주는 함수
    정수가 아니면 400 Bad Request 에러 발생.
    req.params가 문자열이라도 여기서 검증 + 숫자로 변환.
*/
export function parseEventIdParam(params) {
  const eventId = toPosInt(params.eventId, NaN);
  if (!Number.isFinite(eventId)) {
    const err = new Error("Invalid eventId");
    err.status = 400;
    throw err;
  }
  return { eventId };
}

/*  이벤트 수정 시(PATCH /api/events/:eventId) req.body를 검증/가공하는 함수.
 */
export function parseEditBody(body) {
  const out = {};

  if (body.title !== undefined) out.title = String(body.title).trim();
  if (body.content !== undefined) out.content = String(body.content).trim();

  if (body.restaurantId !== undefined) {
    const n = toPosInt(body.restaurantId, NaN);
    if (!Number.isFinite(n)) {
      const err = new Error("Invalid restaurantId");
      err.status = 400;
      throw err;
    }
    out.restaurantId = n;
  }

  let startAtDate, endAtDate;

  if (body.startAt !== undefined) {
    startAtDate = new Date(body.startAt);
    if (Number.isNaN(startAtDate.getTime())) {
      const err = new Error("Invalid startAt");
      err.status = 400;
      throw err;
    }
    out.startAt = startAtDate;
  }

  if (body.endAt !== undefined) {
    endAtDate = new Date(body.endAt);
    if (Number.isNaN(endAtDate.getTime())) {
      const err = new Error("Invalid endAt");
      err.status = 400;
      throw err;
    }
    out.endAt = endAtDate;
  }

  // ✅ 서로 관계 검증 (둘 다 있을 때만)
  if (startAtDate && endAtDate && endAtDate <= startAtDate) {
    const err = new Error("endAt must be after startAt");
    err.status = 400;
    throw err;
  }

  if (body.maxParticipants !== undefined) {
    const n = toPosInt(body.maxParticipants, NaN);
    if (!Number.isFinite(n)) {
      const err = new Error("Invalid maxParticipants");
      err.status = 400;
      throw err;
    }
    out.maxParticipants = n; // 응답용
  }

  // ⚠️ 스키마에 없는 필드는 무시 (또는 에러로 처리)
  // if (body.status !== undefined) { ... } // Events에 없음 → 제거

  return out;
}
