import { prisma } from "../../../db.config.js";

/** 생성 */
export const createCommentRepo = async ({ eventId, creatorId, content }) => {
  return await prisma.comments.create({
    data: {
      eventId,
      creatorId,
      content,
    },
  });
};

/** 목록 (최신순) + 작성자 일부 정보 선택 가능 */
export const listCommentsRepo = async ({ eventId, page, size }) => {
  const skip = (page - 1) * size;
  return await prisma.comments.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    skip,
    take: size,
    include: {
      users: { select: { id: true, nickname: true, profile_img: true } },
    },
  });
};

/** 총 개수 */
export const countCommentsRepo = async ({ eventId }) => {
  return await prisma.comments.count({ where: { eventId } });
};

/** 단건 조회 */
export const findCommentByIdRepo = async (commentId) => {
  return await prisma.comments.findUnique({
    where: { id: commentId },
  });
};

/** 삭제 */
export const deleteCommentRepo = async (commentId) => {
  try {
    return await prisma.comments.delete({ where: { id: commentId } });
  } catch (e) {
    // 존재하지 않으면 에러가 나므로 null 반환
    return null;
  }
};
