import { prisma } from "../../db.config.js";

/**
 * **[Chats]**
 * **<📦 Repository>**
 * ***createChatsRepo***
 * 새로운 채팅 메시지를 생성합니다.
 * @param {Object} params - 채팅 생성 파라미터
 * @param {number} params.eventId - 채팅이 속한 이벤트 ID
 * @param {number} params.userId - 메시지를 작성한 사용자 ID
 * @param {string} params.content - 채팅 메시지 내용
 * @returns {Object} - 생성된 채팅 객체
 */
export const createChatsRepo = async ({ eventId, userId, content }) => {
  return await prisma.chats.create({ data: { eventId, userId, content } });
};

/**
 * **[Chats]**
 * **<📦 Repository>**
 * ***findEventByIdRepo***
 * 특정 이벤트 ID로 이벤트 존재 여부를 조회합니다.
 * @param {number} eventId - 조회할 이벤트 ID
 * @returns {Object|null} - 해당 이벤트 객체 또는 null
 */
export const findEventByIdRepo = async (eventId) => {
  return await prisma.events.findUnique({ where: { id: eventId } });
};

/**
 * **[Chats]**
 * **<📦 Repository>**
 * ***findEventApplicationRepo***
 * 특정 이벤트에 사용자가 참가 신청했는지 여부를 조회합니다.
 * @param {Object} params - 조회 파라미터
 * @param {number} params.eventId - 이벤트 ID
 * @param {number} params.userId - 사용자 ID
 * @returns {Object|null} - 참가 신청 객체 또는 null
 */
export const findEventApplicationRepo = async ({ eventId, userId }) => {
  return await prisma.eventApplications.findFirst({
    where: { eventId, creatorId: userId },
  });
};

/**
 * **[Chats]**
 * **<📦 Repository>**
 * ***listChatsRepo***
 * 특정 이벤트 채팅방의 메시지 목록을 조회합니다.
 * @param {Object} params - 조회 파라미터
 * @param {number} params.eventId - 이벤트 ID
 * @param {number|null} params.cursor - 커서 기반 페이지네이션용 마지막 채팅 ID
 * @param {number} params.size - 조회할 채팅 개수
 * @returns {Object[]} - 채팅 객체 배열 (작성자 정보 포함)
 */
export const listChatsRepo = async ({ eventId, cursor, size }) => {
  return await prisma.chats.findMany({
    where: { eventId, ...(cursor ? { id: { lt: cursor } } : {}) },
    orderBy: { id: "desc" },
    take: size,
    include: { users: { select: { id: true, nickname: true } } },
  });
};
