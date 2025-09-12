export const mapChatsResponseDto = (row) => ({
  id: row.id,
  eventId: row.eventId,
  userId: row.userId,
  content: row.content,
  created_at: row.createdAt,
});

export const mapChatsListResponseDto = (rows, nextCursor) => ({
  items: rows.map(mapChatsReponseDto),
  nextCursor: nextCursor ?? null,
});
