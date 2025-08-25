// src/reviews/service/reviews.service.js
import * as ReviewsRepo from "../repository/reviews.repository.js";

/**
 * 커스텀 에러 유틸
 */
const conflict = (message) => {
  const err = new Error(message);
  err.status = 409;
  return err;
};
const notFound = (message) => {
  const err = new Error(message);
  err.status = 404;
  return err;
};

/**
 * 리뷰 생성 (중복 금지)
 */
export const createReview = async ({ userId, score }) => {
  // userId UNIQUE이므로 사전 중복 체크
  const existing = await ReviewsRepo.findByUserId(userId);
  if (existing) {
    throw conflict("review already exists");
  }

  try {
    const review = await ReviewsRepo.create({ userId, score });
    return review;
  } catch (err) {
    // 동시성으로 UNIQUE 제약이 터진 경우
    if (err?.code === "P2002" && err?.meta?.target?.includes("user_id")) {
      throw conflict("review already exists");
    }
    throw err;
  }
};

/**
 * 리뷰 조회 (없으면 404)
 */
export const getReview = async (userId) => {
  const review = await ReviewsRepo.findByUserId(userId);
  if (!review) {
    throw notFound("review not found");
  }
  return review;
};
