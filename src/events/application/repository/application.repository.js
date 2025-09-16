// src/events/application/repository/application.repository.js
import { PrismaClient } from "../../../generated/prisma/index.js";
const prisma = new PrismaClient();

const dbOf = (tx) => tx ?? prisma;

/** (eventId, creatorId) 중복 신청 존재 여부 */
export const findOneByPair = async ({ eventId, creatorId }, tx) => {
  const db = dbOf(tx);
  return db.eventApplications.findFirst({
    where: {
      eventId: Number(eventId),
      creatorId: Number(creatorId),
    },
  });
};

/** 신청 생성 */
export const create = async ({ eventId, creatorId }, tx) => {
  const db = dbOf(tx);
  return db.eventApplications.create({
    data: {
      eventId: Number(eventId),
      creatorId: Number(creatorId),
    },
  });
};

/** 신청 삭제(취소) — 현재 스키마에는 취소 플래그가 없으므로 deleteMany */
export const deleteByPair = async ({ eventId, creatorId }) => {
  return prisma.eventApplications.deleteMany({
    where: {
      eventId: Number(eventId),
      creatorId: Number(creatorId),
    },
  });
};

/** 내가 신청한 목록 */
export const findByApplicant = async ({ creatorId, skip = 0, take = 10 }) => {
  return prisma.eventApplications.findMany({
    where: { creatorId: Number(creatorId) },
    orderBy: { createdAt: "desc" },
    skip: Number(skip) || 0,
    take: Number(take) || 10,
    include: {
      events: true, // ← 스키마의 관계명
      users: { select: { id: true, nickname: true } },
    },
  });
};

/** 내가 신청한 총 개수 */
export const countByApplicant = async ({ creatorId }) => {
  return prisma.eventApplications.count({
    where: { creatorId: Number(creatorId) },
  });
};

export const findById = async (applicationId, tx) => {
  const db = tx ?? prisma;
  return db.eventApplications.findUnique({
    where: { id: Number(applicationId) },
  });
};

export const deleteById = async (applicationId) => {
  // count 가 필요하면 deleteMany, 아니면 delete
  return prisma.eventApplications.delete({
    where: { id: Number(applicationId) },
  });
};
