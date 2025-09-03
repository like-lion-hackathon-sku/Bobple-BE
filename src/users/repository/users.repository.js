import { prisma } from "../../db.config.js";

/** 공개 응답용 select */
export const PUBLIC_SELECT = {
  id: true,
  nickname: true,
  grade: true,
  gender: true,      // enum: "M" | "F" | "N" | null
  profileImg: true,  // prisma 필드명 (DB 컬럼은 profile_img)
  createdAt: true,
};

/** 개인/관리자 응답용 select */
export const PRIVATE_SELECT = {
  ...PUBLIC_SELECT,
  email: true,
  uid: true,
  isCompleted: true,
  updatedAt: true,
};

/** 공개 프로필: id로 조회 */
export const findUserPublicById = (id) =>
  prisma.users.findUnique({
    where: { id },
    select: PUBLIC_SELECT,
  });

/** 개인 프로필: id로 조회 */
export const findUserPrivateById = (id) =>
  prisma.users.findUnique({
    where: { id },
    select: PRIVATE_SELECT,
  });
