import {
  createReviewRepo,
  listReceivedReviewsRepo,
  findUserByIdRepo,
} from "../repository/reviews.repository.js";

// 리뷰 생성 서비스
export const createReviewSvc = async (dto) => {
  const user = await findUserByIdRepo(dto.revieweeId);
  if (!user) {
    const err = new Error("reviewee not found");
    err.status = 404;
    throw err;
  }
  return createReviewRepo(dto);
};

// 특정 유저가 받은 리뷰 — 평균/총개수 제거, 기본 2개만
export const listReviewsOfUserSvc = async ({ userId, take, page }) => {
  const skip = (page - 1) * take;
  const items = await listReceivedReviewsRepo({ userId, take, skip });
  return { items, pagination: { page, take } }; // total/avg 없음
};
