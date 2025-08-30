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

/** 목록 조회 (페이지네이션, 최신순) */
export async function findMany(skip = 0, take = 12) {
  const _skip = toPosInt(skip, 0);
  const _take = toPosInt(take, 12);

  const rows = await prisma.events.findMany({
    skip: _skip,
    take: _take,
    orderBy: { createdAt: "desc" },
    include: {
      // ⚠️ 스키마: Events.users / Events.restaurants
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

/** 수정 */
export function updateById(eventId, data) {
  const id = Number(eventId);
  if (!Number.isInteger(id) || id <= 0) {
    const e = new Error("Invalid eventId");
    e.status = 400;
    throw e;
  }
  return prisma.events.update({ where: { id }, data });
}

/** 삭제 */
export function deleteById(eventId) {
  const id = Number(eventId);
  if (!Number.isInteger(id) || id <= 0) {
    const e = new Error("Invalid eventId");
    e.status = 400;
    throw e;
  }
  return prisma.events.delete({ where: { id } });
}

/* ========= DTO ========= */

function toListItemDTO(e) {
  return {
    id: e.id,
    title: e.title,
    content: e.content,
    startAt: e.startAt, // Prisma 필드명을 그대로 사용 (camelCase)
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
