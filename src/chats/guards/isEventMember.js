import { prisma } from "../../db.config.js";

/**
 * userId가 eventId 채팅방의 멤버인지 확인
 * - 호스트(Events.creatorId == userId)면 멤버
 * - EventApplications 테이블에 (eventId, creatorId=userId) 레코드가 있으면 멤버
 *   ※ 현재 스키마엔 status 필드가 없으므로 "신청 == 멤버"로 간주
 *     (승인/거절이 필요해지면 status 컬럼 추가 후 조건에 포함하면 됩니다)
 */
export const isEventMember = async (userId, eventId) => {
  if (!Number.isFinite(userId) || !Number.isFinite(eventId)) return false;

  // 1) 이벤트 존재 + 호스트 여부 확인
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: { id: true, creatorId: true },
  });
  if (!event) return false;
  if (event.creatorId === userId) return true;

  // 2) 신청자(=참여자) 여부 확인
  const applied = await prisma.eventApplications.findFirst({
    where: { eventId, creatorId: userId },
    select: { id: true },
  });

  return !!applied;
};
