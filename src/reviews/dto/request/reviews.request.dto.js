// 스키마: userId, score만 저장

export const bodyToCreateReview = (req) => ({
  revieweeId: Number(req.params.userId), // 리뷰 받는 유저
  score: Number(req.body?.score),
});

export const validateCreateReview = (dto) => {
  if (!Number.isInteger(dto.revieweeId) || dto.revieweeId < 1)
    return "invalid userId";
  if (!Number.isFinite(dto.score) || dto.score < 0 || dto.score > 5)
    return "score must be between 0 and 5";
  return null;
};

// 기본 2개만 보여주기 (사진처럼)
export const queryToListOptions = (req) => {
  const take = Math.min(Math.max(Number(req.query.take ?? 2), 1), 50); // 기본 2
  const page = Math.max(Number(req.query.page ?? 1), 1);
  return { take, page };
};
