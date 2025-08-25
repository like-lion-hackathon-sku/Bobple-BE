// 요청 값(파라미터/쿼리/바디)을 안전하게 검증/정규화하는 유틸리티들입니다.
// 실패 시 { status, message } 형태의 에러를 던집니다.

const toInt = (v) => Number(v);
const isPosInt = (n) => Number.isInteger(n) && n >= 1;

const badReq = (msg) => Object.assign(new Error(msg), { status: 400 });
const unauthorized = (msg = "unauthorized") =>
  Object.assign(new Error(msg), { status: 401 });

/** 댓글 생성: path:eventId, userId, body:content */
export function validateCreateComment({ eventId, userId, content }) {
  const eid = toInt(eventId);
  const uid = toInt(userId);
  const text = String(content ?? "").trim();

  if (!isPosInt(eid)) throw badReq("invalid eventId");
  if (!uid) throw unauthorized();
  if (!text) throw badReq("content is required");
  if (text.length > 1000) throw badReq("content must be <= 1000 chars");

  return { eventId: eid, userId: uid, content: text };
}

/** 목록 조회: path:eventId, query:page,limit */
export function validateListComments({ eventId, page = 1, limit = 20 }) {
  const eid = toInt(eventId);
  if (!isPosInt(eid)) throw badReq("invalid eventId");

  const pg = Math.max(1, toInt(page));
  let lim = toInt(limit);
  lim = Math.min(100, Math.max(1, lim));

  const skip = (pg - 1) * lim;
  return { eventId: eid, page: pg, limit: lim, skip };
}

/** 삭제: path:eventId,commentId, userId */
export function validateDeleteComment({ eventId, commentId, userId }) {
  const eid = toInt(eventId);
  const cid = toInt(commentId);
  const uid = toInt(userId);

  if (!uid) throw unauthorized();
  if (!isPosInt(eid)) throw badReq("invalid eventId");
  if (!isPosInt(cid)) throw badReq("invalid commentId");

  return { eventId: eid, commentId: cid, userId: uid };
}
