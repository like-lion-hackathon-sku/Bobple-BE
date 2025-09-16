import {
  createCommentRepo,
  listCommentsRepo,
  countCommentsRepo,
  deleteCommentRepo,
  findCommentByIdRepo,
} from "../repository/comments.repository.js";

/** 댓글 작성 */
export const createCommentSvc = async ({ eventId, creatorId, content }) => {
  // (선택) 이벤트/유저 존재 확인은 필요 시 추가
  return await createCommentRepo({ eventId, creatorId, content });
};

/** 댓글 리스트 (페이지네이션) */
export const listCommentsSvc = async ({ eventId, page, size }) => {
  const [items, total] = await Promise.all([
    listCommentsRepo({ eventId, page, size }),
    countCommentsRepo({ eventId }),
  ]);
  return { items, page, size, total };
};

/** 댓글 삭제 */
export const deleteCommentSvc = async ({ eventId, commentId }) => {
  // (선택) 권한 체크는 인증 도입 시 적용
  const existing = await findCommentByIdRepo(commentId);
  if (!existing || existing.eventId !== eventId) throw new Error("comment not found");
  return await deleteCommentRepo(commentId);
};
