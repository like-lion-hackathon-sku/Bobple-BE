// 위치 : src/events/creation/service/creation.service.js
import { PrismaClient } from "../../../generated/prisma/index.js";
const prisma = new PrismaClient();

/* 밥약 글 생성 함수
 */
export async function createEvent(dto, user) {
  return prisma.events.create({
    data: {
      title: dto.title, // 제목
      content: dto.content, // 내용
      startAt: dto.startAt, // 데이트 시작 시간
      endAt: dto.endAt, // 데이트 종료 시간
      creatorId: user.id, // 글쓴이 아이디
      restaurantId: dto.restaurantId, // 레스토랑 아이디
    },
  });
}
