// 위치 : src/events/application/service/application.service.js
import * as appRepo from "../repository/application.repository.js";
import { PrismaClient } from "../../../generated/prisma/index.js";
const prisma = new PrismaClient();

function toPosInt(n) {
  const v = Number(n);
  return Number.isInteger(v) && v > 0 ? v : NaN;
}

/* 밥약 신청 생성
 */
export async function apply(eventId, user) {
  const creatorId = toPosInt(user?.id);
  const evId = toPosInt(eventId);

  if (!evId) throw new Error("INVALID_EVENT_ID");
  if (!creatorId) throw new Error("UNAUTHORIZED");

  // 이벤트 확인
  const ev = await prisma.events.findUnique({ where: { id: evId } });
  if (!ev) throw new Error("EVENT_NOT_FOUND");
  if (ev.creatorId === creatorId) throw new Error("CANNOT_APPLY_OWN_EVENT");

  // ✅ 경쟁 조건 방지: 트랜잭션으로 확인+생성 묶기
  return prisma.$transaction(async (tx) => {
    const exists = await appRepo.findOneByPair(
      { eventId: evId, creatorId },
      tx,
    );
    if (exists) return exists;

    // unique 제약이 DB에 없다면(P2002 기대 불가) 서비스 레벨에서만 보장됨
    return appRepo.create({ eventId: evId, creatorId }, tx);
  });
}

/* 밥약 신청 취소
 */
export async function cancel(eventId, creatorIdParam, user) {
  const me = toPosInt(user?.id);
  const evId = toPosInt(eventId);
  if (!evId) throw new Error("INVALID_EVENT_ID");
  if (!me) throw new Error("UNAUTHORIZED");

  const ev = await prisma.events.findUnique({ where: { id: evId } });
  if (!ev) throw new Error("EVENT_NOT_FOUND");

  // 취소 대상 결정
  let targetCreatorId;
  if (!creatorIdParam || creatorIdParam === "me") {
    targetCreatorId = me;
  } else {
    const parsed = toPosInt(creatorIdParam);
    if (!parsed) throw new Error("INVALID_APPLICANT_ID");
    if (ev.creatorId !== me) throw new Error("FORBIDDEN"); // 호스트만 타 유저 취소
    targetCreatorId = parsed;
  }

  const result = await appRepo.deleteByPair({
    eventId: evId,
    creatorId: targetCreatorId,
  });
  // 정책 선택지:
  // if (!result.count) throw new Error('APPLICATION_NOT_FOUND');
  return { deleted: result.count ?? 0 };
}

/* 내가 신청한 밥약 리스트
 */
export async function mine(user, query = {}) {
  const creatorId = toPosInt(user?.id);
  if (!creatorId) throw new Error("UNAUTHORIZED");

  const page = Math.max(1, toPosInt(query.page) || 1);
  const size = Math.min(50, Math.max(1, toPosInt(query.size) || 10));
  const skip = (page - 1) * size;
  const take = size;

  const [items, total] = await Promise.all([
    appRepo.findByApplicant({ creatorId, skip, take }),
    appRepo.countByApplicant({ creatorId }),
  ]);

  return { page, size, total, items };
}
