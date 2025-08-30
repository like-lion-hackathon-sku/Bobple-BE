// src/events/event/repository/event.repository.js
import { PrismaClient } from "../../../generated/prisma/index.js";

/** PrismaClient 싱글턴 */
const g = globalThis;
const prisma = g.__bobplePrisma ?? new PrismaClient();
if (!g.__bobplePrisma) g.__bobplePrisma = prisma;

/** 숫자 가드 */
const toPosInt = (v, def = 0) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : def;
};

/** 내부 공통: 이벤트 + 작성자 id 조회 */
async function getEventOwner(tx, id) {
  // 스키마에 따라 creatorId 또는 userId/authorId 등일 수 있어 넓게 대응
  const row = await tx.events.findUnique({
    where: { id },
    select: {
      id: true,
      creatorId: true,
      userId: true,
      authorId: true,
    },
  });
  return row ? (row.creatorId ?? row.userId ?? row.authorId ?? null) : null;
}

/** 목록 조회 (페이지네이션, 최신순) */
export async function findMany(skip = 0, take = 12) {
  const _skip = toPosInt(skip, 0);
  const _take = toPosInt(take, 12);

  const rows = await prisma.events.findMany({
    skip: _skip,
    take: _take,
    orderBy: { createdAt: "desc" },
    include: {
      // ⚠️ 현재 스키마: Events.users / Events.restaurants
      users: { select: { id: true, nickname: true } },
      restaurants: { select: { id: true, name: true } },
      _count: { select: { eventApplications: true } },
    },
  });

  return rows.map(toListItemDTO);
}

/** 전체 개수 */
export function countAll() {
  return prisma.events.count();
}

/** 상세 + 참가자 포함 */
export async function findByIdWithParticipants(eventId) {
  const id = Number(eventId);
  if (!Number.isInteger(id) || id <= 0) {
    const e = new Error("Invalid eventId");
    e.status = 400;
    throw e;
  }

  const row = await prisma.events.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, nickname: true } },
      restaurants: {
        select: {
          id: true,
          name: true,
          category: true,
          address: true,
          telephone: true,
        },
      },
      eventApplications: {
        orderBy: { createdAt: "asc" },
        include: {
          // ⚠️ 스키마: EventApplications.users
          users: { select: { id: true, nickname: true } },
        },
      },
      _count: { select: { eventApplications: true } },
    },
  });

  return row ? toDetailDTO(row) : null;
}

/** 수정(작성자 권한) */
export async function updateById(eventId, data, user) {
  const id = Number(eventId);
  if (!Number.isInteger(id) || id <= 0) {
    const e = new Error("Invalid eventId");
    e.status = 400;
    throw e;
  }
  if (!user?.id) {
    const e = new Error("UNAUTHORIZED");
    e.status = 401;
    throw e;
  }

  return await prisma.$transaction(async (tx) => {
    const ownerId = await getEventOwner(tx, id);
    if (ownerId == null) {
      const e = new Error("NOT_FOUND");
      e.status = 404;
      throw e;
    }
    if (ownerId !== user.id) {
      const e = new Error("FORBIDDEN");
      e.status = 403;
      throw e;
    }

    const updated = await tx.events.update({ where: { id }, data });
    // 수정 후 목록 DTO 형태로 반환해도 되고, 상세 DTO로 반환해도 됨.
    // 서비스에서 normalize하므로 원본 그대로 반환해도 OK
    return updated;
  });
}

/** 삭제(작성자 권한) — 댓글/신청 먼저 삭제 후 이벤트 삭제 */
export async function deleteById(eventId, user) {
  const id = Number(eventId);
  if (!Number.isInteger(id) || id <= 0) {
    const e = new Error("Invalid eventId");
    e.status = 400;
    throw e;
  }
  if (!user?.id) {
    const e = new Error("UNAUTHORIZED");
    e.status = 401;
    throw e;
  }

  return await prisma.$transaction(async (tx) => {
    const ownerId = await getEventOwner(tx, id);
    if (ownerId == null) {
      const e = new Error("NOT_FOUND");
      e.status = 404;
      throw e;
    }
    if (ownerId !== user.id) {
      const e = new Error("FORBIDDEN");
      e.status = 403;
      throw e;
    }

    // 자식 먼저 정리 (DB FK가 ON DELETE CASCADE면 이 블록은 생략 가능)
    await tx.comments.deleteMany({ where: { eventId: id } });
    await tx.eventApplications.deleteMany({ where: { eventId: id } });

    await tx.events.delete({ where: { id } });
    return { deleted: 1 };
  });
}

/* ========= DTO ========= */

function toListItemDTO(e) {
  return {
    id: e.id,
    title: e.title,
    content: e.content ?? null,
    startAt: e.startAt,
    endAt: e.endAt,
    chatUrl: `/chats/event/${e.id}`,
    participantsCount: e._count?.eventApplications ?? 0,
    creator: e.users ? { id: e.users.id, nickname: e.users.nickname } : null,
    restaurant: e.restaurants
      ? { id: e.restaurants.id, name: e.restaurants.name }
      : null,
  };
}

function toDetailDTO(e) {
  return {
    ...toListItemDTO(e),
    restaurant: e.restaurants
      ? {
          id: e.restaurants.id,
          name: e.restaurants.name,
          category: e.restaurants.category,
          address: e.restaurants.address,
          telephone: e.restaurants.telephone,
        }
      : null,
    applications:
      e.eventApplications?.map((a) => ({
        id: a.id,
        createdAt: a.createdAt,
        user: a.users ? { id: a.users.id, nickname: a.users.nickname } : null,
      })) ?? [],
  };
}
