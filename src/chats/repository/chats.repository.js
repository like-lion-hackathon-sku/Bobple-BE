import { prisma } from "../../db.config.js";

/** WS에서 사용: 메시지 저장 + 작성자 조인 */
export const createChatRepo = async ({ eventId, userId, content }) => {
  return prisma.chats.create({
    data: { eventId, userId, content },
    include: {
      users: {
        select: {
          id: true,
          nickname: true,
          profileImg: true, // @map("profile_img") 필드. Prisma에선 camelCase로 접근
        },
      },
    },
  });
};

/** 과거 메시지 조회 */
export const listChatsRepo = async ({ eventId, page, size }) => {
  const skip = (page - 1) * size;
  return prisma.chats.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    skip,
    take: size,
    include: {
      users: {
        select: {
          id: true,
          nickname: true,
          profileImg: true,
        },
      },
    },
  });
};

export const countChatsRepo = async ({ eventId }) => {
  return prisma.chats.count({ where: { eventId } });
};
