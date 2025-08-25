// DB 접근 전용 레이어: Prisma 호출만 담당합니다.
// 비즈니스 규칙은 service에서 처리하고, 여기서는 "무엇을 어떻게 조회/변경할지"만 표현합니다.

import { prisma } from "../../../db.config.js";

export async function findEventById(eventId) {
  return prisma.events.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
}

export async function createComment({ eventId, userId, content }) {
  return prisma.comments.create({
    data: { eventId, creatorId: userId, content },
    select: {
      id: true,
      eventId: true,
      creatorId: true,
      content: true,
      createdAt: true,
    },
  });
}

export async function listCommentsByEvent({
  eventId,
  skip,
  take,
  order = "asc",
}) {
  return prisma.comments.findMany({
    where: { eventId },
    orderBy: { createdAt: order }, 
    skip,
    take,
    select: {
      id: true,
      eventId: true,
      creatorId: true,
      content: true,
      createdAt: true,
    },
  });
}

export async function countCommentsByEvent(eventId) {
  return prisma.comments.count({ where: { eventId } });
}

export async function findCommentByIdInEvent({ commentId, eventId }) {
  return prisma.comments.findFirst({
    where: { id: commentId, eventId },
    select: { id: true, creatorId: true },
  });
}

export async function deleteCommentById(commentId) {
  return prisma.comments.delete({ where: { id: commentId } });
}
