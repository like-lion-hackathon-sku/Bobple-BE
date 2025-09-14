/**
 * **[Chats]**
 * **<💬⬆️ Response DTO>**
 * ***mapChatsResponseDto***
 * '채팅 메시지 생성/조회' 등의 단일 채팅 응답에서 
 * 서비스 레이어가 컨트롤러로 반환할 객체를 매핑하기 위한 DTO
 * @param {Object} row - Prisma에서 조회/생성된 채팅 객체
 * @returns {Object} - API 응답으로 내려갈 채팅 데이터
 */
export const mapChatsResponseDto = (row) => ({
  id: row.id,
  eventId: row.eventId,
  userId: row.userId,
  content: row.content,
  created_at: row.createdAt,
});

/**
 * **[Chats]**
 * **<💬⬆️ Response DTO>**
 * ***mapChatsListResponseDto***
 * '채팅 메시지 목록 조회' 응답에서 
 * 여러 채팅 객체와 페이징 정보를 매핑하기 위한 DTO
 * @param {Object[]} rows - Prisma에서 조회된 채팅 객체 배열
 * @param {number|null} nextCursor - 다음 페이지 조회를 위한 커서 값
 * @returns {Object} - API 응답으로 내려갈 채팅 목록 데이터와 nextCursor
 */
export const mapChatsListResponseDto = (rows, nextCursor) => ({
  items: rows.map(mapChatsResponseDto),
  nextCursor: nextCursor ?? null,
});
