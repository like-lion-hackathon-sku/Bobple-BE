/** 공통 유틸 */
const toInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};

/** POST 바디 → 서비스 입력
 *  인증을 사용하지 않으므로 body에서 creatorId, content를 받음
 *  params에서 eventId를 받음
 */
export const bodyToCreateComment = (req) => {
  const eventId = toInt(req.params?.eventId);
  const creatorId = toInt(req.body?.creatorId);
  const content = String(req.body?.content ?? "").trim();

  if (!Number.isInteger(eventId) || eventId < 1)
    throw new Error("invalid eventId");
  if (!Number.isInteger(creatorId) || creatorId < 1)
    throw new Error("invalid creatorId");
  if (!content) throw new Error("content is required");
  if (content.length > 1000) throw new Error("content must be <= 1000 chars");

  return { eventId, creatorId, content };
};

/** GET 쿼리 → 서비스 입력 (페이지네이션 기본값 page=1,size=10) */
export const queryToListComments = (req) => {
  const eventId = toInt(req.params?.eventId);
  if (!Number.isInteger(eventId) || eventId < 1)
    throw new Error("invalid eventId");

  const page = Math.max(1, toInt(req.query?.page) || 1);
  const size = Math.max(1, Math.min(50, toInt(req.query?.size) || 10));

  return { eventId, page, size };
};

/** DELETE 파라미터 → 서비스 입력 */
export const paramsToDeleteComment = (req) => {
  const eventId = toInt(req.params?.eventId);
  const commentId = toInt(req.params?.commentId);

  if (!Number.isInteger(eventId) || eventId < 1)
    throw new Error("invalid eventId");
  if (!Number.isInteger(commentId) || commentId < 1)
    throw new Error("invalid commentId");

  return { eventId, commentId };
};
