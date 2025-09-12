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
