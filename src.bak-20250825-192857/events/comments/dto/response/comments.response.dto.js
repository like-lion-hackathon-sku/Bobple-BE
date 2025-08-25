// DB에서 가져온 raw 데이터를 API 응답 형태로 정리하는 역할입니다.
// 지금은 필드 이름이 거의 동일하지만, 팀 규칙에 따라 포맷을 바꾸고 싶을 때 여기서 일괄 변경하면 됩니다.

export function toCommentResponse(row) {
  // 필요한 필드만 노출
  return {
    id: row.id,
    eventId: row.eventId,
    creatorId: row.creatorId,
    content: row.content,
    createdAt: row.createdAt,
  };
}

export function toPagedCommentsResponse({ page, limit, total, items }) {
  return {
    page,
    limit,
    total,
    items: items.map(toCommentResponse),
  };
}
