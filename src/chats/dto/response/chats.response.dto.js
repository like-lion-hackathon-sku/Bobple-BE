export const mapChat = (chat) => {
  if (!chat) return null;
  return {
    id: chat.id,
    eventId: chat.eventId,
    user: chat.users
      ? {
          id: chat.users.id,
          nickname: chat.users.nickname,
          profileImg: chat.users.profileImg ?? null, // 프론트에서 쓰는 경우가 많아 같이 내려줌
        }
      : null,
    content: chat.content,
    createdAt: chat.createdAt,
  };
};

export const listChatsResponse = ({ page, size, total, items }) => ({
  page,
  size,
  total,
  items: items.map(mapChat),
});
