import { prisma } from "../../db.config.js";

export const createChatsRepo = async ({ eventId, userId, content }) => {
  return await prisma.chats.create({ data: { eventId, userId, content } });
};

export const findEventByIdRepo = async (eventId) => {
  return await prisma.events.findUnique({ where: { id: eventId } });
};

export const findEventApplicationRepo = async ({ eventId, userId }) => {
  return await prisma.eventApplications.findFirst({
    where: { eventId, creatorId: userId },
  });
};

export const listChatsRepo = async ({ eventId, cursor, size }) => {
  return await prisma.chats.findMany({
    where: { eventid, ...(cursor ? { id: { lt: cursor } } : {}) },
    orderBy: { id: "desc" },
    take: size,
    include: { users: { id: true, nickname: true } },
  });
};
