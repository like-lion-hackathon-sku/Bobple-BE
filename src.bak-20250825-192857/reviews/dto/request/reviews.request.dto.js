// src/reviews/dto/reviews.request.dto.js

/**
 * 공통 에러 헬퍼
 */
const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

export const parseUserIdParam = (req) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId < 1) {
    throw badRequest("invalid userId");
  }
  return userId;
};

export const parseCreateReviewBody = (req) => {
  const score = Number(req.body?.score);
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    throw badRequest("score must be between 1 and 5");
  }
  return { score };
};
