import { InvalidInputValueError } from "../../../error.js";

/**
 * **[Chat]**
 * **<🧺⬇️ Request DTO>**
 * ***sendChatsRequestDto***
 * '채팅 보내기' 기능의 요청 값을 서비스 레이어로 옮기기 위한 DTO 파서 함수
 * 클라이언트로부터 받은 요청(req)을 기반으로 필요한 데이터를 추출하고,
 * 유효성 검사를 수행한 뒤 정제된 데이터를 반환합니다.
 *
 * @param {Object} req - HTTP 요청 객체 (Request Object)
 * @returns {Object} - 유효성 검사를 통과한 리뷰 데이터 객체
 * @throws {InvalidInputValueError} - 유효하지 않은 입력 값이 있을 경우
 */
export const sendChatsRequestDto = (req) => {
  const eventId = Number(req.params.eventId);
  const { content } = req.body ?? {};
  if (!Number.isInteger(eventId) || eventId < 1) {
    throw new InvalidInputValueError(
      "eventId가 올바르지 않습니다.",
      req.params
    );
  }
  if (
    typeof content !== "string" ||
    content.length > 1000 ||
    content.length < 1
  ) {
    throw new InvalidInputValueError(
      "content는 1~1000자여야 합니다.",
      req.body
    );
  }
  if (!req.payload?.id) {
    throw new InvalidInputValueError("로그인이 필요합니다.", req.payload);
  }

  return { eventId, userId: req.payload.id, content };
};

/**
 * **[Chat]**
 * **<🧺⬇️ Request DTO>**
 * ***listChatsRequestDto***
 * '채팅 목록 불러오기' 기능의 요청 값을 서비스 레이어로 옮기기 위한 DTO 파서 함수
 * 클라이언트로부터 받은 요청(req)을 기반으로 필요한 데이터를 추출하고,
 * 유효성 검사를 수행한 뒤 정제된 데이터를 반환합니다.
 *
 * @param {Object} req - HTTP 요청 객체 (Request Object)
 * @returns {Object} - 유효성 검사를 통과한 채팅 목록 데이터 객체
 * @throws {InvalidInputValueError} - 유효하지 않은 입력 값이 있을 경우
 */
export const listChatsRequestDto = (req) => {
  const eventId = Number(req.params.eventId);
  if (!Number.isInteger(eventId) || eventId < 1) {
    throw new InvalidInputValueError(
      "eventId가 올바르지 않습니다.",
      req.params
    );
  }
  const size = req.query.size ? Number(req.query.size) : 30;
  if (!Number.isInteger(size) || size < 1 || size > 100) {
    throw new InvalidInputValueError("size는 1~100이여야 합니다.", req.query);
  }
  const cursor = req.query.cursor ? Number(req.query.cursor) : null;
  if (cursor !== null && (!Number.isInteger(cursor) || cursor < 1)) {
    throw new InvalidInputValueError(
      "cursor는 양의 정수여야 합니다.",
      req.query
    );
  }
  const userId = req.payload?.id ?? req.payload?.userId;
  if (!userId) {
    throw new InvalidInputValueError("로그인이 필요합니다.", req.payload);
  }
  return { eventId, cursor, size, userId };
};

/**
 * **[Chats]**
 * **<🚪⬅️ Request DTO>**
 * ***leaveChatRequestDto***
 * '채팅방 나가기' 요청에서 컨트롤러가 서비스 레이어로 전달할 객체를 매핑하기 위한 DTO
 * @param {Object} req - Express 요청 객체
 * @returns {Object} - 서비스 레이어로 전달될 { eventId, userId }
 */
export const leaveChatRequestDto = (req) => {
  const eventId = Number(req.params.eventId);
  if (!Number.isInteger(eventId) || eventId < 1) {
    throw new InvalidInputValueError(
      "eventId가 올바르지 않습니다.",
      req.params
    );
  }
  const userId = req.payload?.id ?? req.payload?.userId;
  if (!userId) {
    throw new InvalidInputValueError("로그인이 필요합니다.", req.payload);
  }
  return { eventId, userId };
};
