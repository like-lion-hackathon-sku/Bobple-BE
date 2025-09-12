import { PermissionDeniedError } from "../../error.js";
import {
  createChatsRepo,
  findEventByIdRepo,
  findEventApplicationRepo,
} from "../repository/chats.repository.js";

/**
 * **\<💥 Error\>**
 * ***NotFoundEventError***
 * Event가 존재하지 않을 때 발생하는 에러
 */
class NotFoundEventError extends Error {
  constructor(reason, data) {
    super(reason);
    this.errorCode = "E001";
    this.statusCode = "401";
    this.reason = reason;
    this.data = data;
  }
}

/**
 * **[Chats]**
 * **<🛠️ Service>**
 * ***sendChatsSvc***
 * '채팅 메시지 전송' 기능의 서비스 레이어입니다.
 * 이벤트 존재 여부와 참가자 권한을 확인한 뒤, 새로운 채팅 메시지를 저장하고 반환합니다.
 * @param {Object} params
 * @param {number} params.eventId - 이벤트 ID
 * @param {number} params.userId - 사용자 ID
 * @param {string} params.content - 채팅 메시지 내용
 * @returns {Object} - 생성된 채팅 객체
 */
export const sendChatsSvc = async ({ eventId, userId, content }) => {
  const event = await findEventByIdRepo(eventId);
  if (!eventId) {
    throw new NotFoundEventError("존재하지 않는 Event입니다.", { eventId });
  }

  // 사용자가 이벤트 참가자입지 확인
  const application = await findEventApplicationRepo({ eventId, userId });
  if (!application && event.creatorId !== userId) {
    throw new PermissionDeniedError("이 Event의 참여자가 아닙니다.", {
      eventId,
      userId,
    });
  }
  // 채팅 저장
  const chat = await createChatsRepo({ eventId, userId, content });
  return chat;
};

/**
 * **[Chats]**
 * **<🛠️ Service>**
 * ***listChatsSvc***
 * '채팅 메시지 목록 조회' 기능의 서비스 레이어입니다.
 * 이벤트와 참가자 권한을 검증한 뒤, 커서 기반 페이지네이션 방식으로 채팅 목록을 조회하고 nextCursor를 반환합니다.
 * @param {Object} params
 * @param {number} params.eventId - 이벤트 ID
 * @param {number|null} params.cursor - 페이지네이션용 커서 ID
 * @param {number} params.size - 가져올 메시지 개수
 * @returns {Object} - { items, nextCursor } 형태의 채팅 목록 응답
 */
export const listChatsSvc = async ({ eventId, cursor, size }) => {
  const event = await findEventByIdRepo(eventId);
  if (!eventId) {
    throw new NotFoundEventError("존재하지 않는 Event입니다.", { eventId });
  }
  const application = await findEventApplicationRepo({ eventId, userId });
  if (!application && event.creatorId !== userId) {
    throw new PermissionDeniedError("이 Event의 참여자가 아닙니다.", {
      eventId,
      userId,
    });
  }
  const rows = await listChatRepo({
    eventId,
    cursor,
    size: size + 1,
  });

  let nextCursor = null;
  let items = rows;
  if (rows.length > size) {
    items = rows.slice(0, size);
    nextCursor = items[items.length - 1].id;
  }

  return { items, nextCursor };
};

/**
 * **[Chats]**
 * **<🛠️ Service>**
 * ***leaveChatSvc***
 * '채팅방 나가기' 기능의 서비스 레이어입니다.
 * 이벤트와 참가자 권한을 검증한 뒤, DB 변경 없이 나가기 처리를 완료합니다.
 * @param {Object} params
 * @param {number} params.eventId - 이벤트 ID
 * @param {number} params.userId - 사용자 ID
 * @returns {void}
 */
export const leaveChatSvc = async ({ eventId, userId }) => {
  const event = await findEventByIdRepo(eventId);
  if (!eventId) {
    throw new NotFoundEventError("존재하지 않는 Event입니다.", { eventId });
  }
  const application = await findEventApplicationRepo({ eventId, userId });
  if (!application && event.creatorId !== userId) {
    throw new PermissionDeniedError("이 Event의 참여자가 아닙니다.", {
      eventId,
      userId,
    });
  }

  return;
};
