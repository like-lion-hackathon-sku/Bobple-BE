import { prisma } from "../../db.config.js";

// (선택) 피평가자 존재 확인
export const findUserByIdRepo = (id) =>
  prisma.users.findUnique({ where: { id }, select: { id: true } });

// 리뷰 생성 (score만 저장)
export const createReviewRepo = (data) =>
  prisma.reviews.create({
    data: {
      userId: data.revieweeId,
      score: data.score,
    },
    select: { id: true, userId: true, score: true, createdAt: true },
  });

// 받은 리뷰 목록 (최신순, take/skip)
export const listReceivedReviewsRepo = ({ userId, take, skip }) =>
  prisma.reviews.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    skip,
    select: { id: true, userId: true, score: true, createdAt: true },
  });
