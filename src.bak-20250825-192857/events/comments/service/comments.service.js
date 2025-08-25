// 도메인 비즈니스 로직 레이어: 검증 → 무결성 확인(이벤트 존재 등) → 저장/조회 → 응답 DTO 구성.

import {
  validateCreateComment,
  validateListComments,
  validateDeleteComment,
} from "../dto/comments.request.dto.js";

import {
  toCommentResponse,
  toPagedCommentsResponse,
} from "../dto/comments.response.dto.js";

import {
  findEventById,
  createComment as repoCreateComment,
  listCommentsByEvent,
  countCommentsByEvent,
  findCommentByIdInEvent,
  deleteCommentById,
} from "../repository/comments.repository.js";

const notFound = (msg) => Object.assign(new Error(msg), { status: 404 });
const forbidden = (msg = "forbidden") =>
  Object.assign(new Error(msg), { status: 403 });

/** 댓글 생성 */
export async function createCommentService(raw) {
  // 1) 입력 검증/정규화
  const { eventId, userId, content } = validateCreateComment(raw);

  // 2) 참조 무결성: 이벤트 존재 여부
  const exists = await findEventById(eventId);
  if (!exists) throw notFound("event not found");

  // 3) 저장
  const created = await repoCreateComment({ eventId, userId, content });

  // 4) 응답 DTO
  return toCommentResponse(created);
}

/** 목록 조회 */
export async function listCommentsService(raw) {
  const { eventId, page, limit, skip } = validateListComments(raw);

  // 목록 + 총 개수 병렬
  const [items, total] = await Promise.all([
    listCommentsByEvent({ eventId, skip, take: limit, order: "asc" }),
    countCommentsByEvent(eventId),
  ]);

  return toPagedCommentsResponse({ page, limit, total, items });
}

/** 삭제(작성자 본인만) */
export async function deleteCommentService(raw) {
  const { eventId, commentId, userId } = validateDeleteComment(raw);

  const comment = await findCommentByIdInEvent({ commentId, eventId });
  if (!comment) throw notFound("comment not found");
  if (comment.creatorId !== userId) throw forbidden();

  await deleteCommentById(commentId);
  // 204 No Content를 컨트롤러에서 보낼 수 있도록 별도 반환값 없음
  return;
}
