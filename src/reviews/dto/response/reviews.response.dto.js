// DB → API 응답 매핑 (별점/날짜만 전달)

export const mapReviewItem = (r) => ({
  id: r.id,
  userId: r.userId, // 리뷰를 받은 유저 ID
  score: r.score, // 0~5 (프론트에서 별 렌더)
  createdAt: r.createdAt, // 날짜 포맷은 프론트에서
});

export const createReviewResponse = (r) => mapReviewItem(r);

// 평균/개수 없이, 항목만
export const listReviewsResponse = ({ items, pagination }) => ({
  items: items.map(mapReviewItem),
  pagination, // 필요 없으면 라우터에서 무시 가능
});
