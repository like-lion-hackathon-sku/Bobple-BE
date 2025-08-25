// src/reviews/dto/reviews.response.dto.js

/**
 * DB Review -> API Review
 */
export const mapReview = (r) => {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.userId,
    score: r.score,
    createdAt: r.createdAt,
  };
};

/**
 * POST /api/reviews/:userId 결과
 */
export const createReviewResponse = (review) => mapReview(review);

/**
 * GET /api/reviews/:userId 결과
 * 모델 특성상 average === review.score
 */
export const getReviewResponse = (review) => {
  if (!review) return { average: null, review: null };
  return { average: review.score, review: mapReview(review) };
};
