/** DB Comment -> API Comment */
export const mapComment = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    eventId: c.eventId,
    creatorId: c.creatorId,
    content: c.content,
    createdAt: c.createdAt,
    // 확장: 작성자 표시가 필요하면 users select 추가 후 다음 키도 제공 가능
    author: c.users
      ? { id: c.users.id, nickname: c.users.nickname ?? null, profileImg: c.users.profile_img ?? null }
      : undefined,
  };
};

export const createCommentResponse = (created) => mapComment(created);

export const listCommentsResponse = ({ items, page, size, total }) => ({
  page,
  size,
  total,
  items: items.map(mapComment),
});

export const deleteCommentResponse = (deleted) => ({
  deletedId: deleted?.id ?? null,
  ok: !!deleted,
});
