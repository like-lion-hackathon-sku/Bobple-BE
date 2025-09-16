import {
  bodyToCreateComment,
  queryToListComments,
  paramsToDeleteComment,
} from "../dto/request/comments.request.dto.js";
import {
  createCommentResponse,
  listCommentsResponse,
  deleteCommentResponse,
} from "../dto/response/comments.response.dto.js";
import {
  createCommentSvc,
  listCommentsSvc,
  deleteCommentSvc,
} from "../service/comments.service.js";

/** 댓글 작성 */
export const createComment = async (req, res) => {
  try {
    const data = bodyToCreateComment(req);
    const created = await createCommentSvc(data);
    return res.status(201).json(createCommentResponse(created));
  } catch (err) {
    const code = err.statusCode ?? 400;
    return res.status(code).json({ message: err.message ?? "bad request" });
  }
};

/** 댓글 리스트 */
export const listComments = async (req, res) => {
  try {
    const data = queryToListComments(req);
    const result = await listCommentsSvc(data);
    return res.status(200).json(listCommentsResponse(result));
  } catch (err) {
    const code = err.statusCode ?? 400;
    return res.status(code).json({ message: err.message ?? "bad request" });
  }
};

/** 댓글 삭제 */
export const deleteComment = async (req, res) => {
  try {
    const data = paramsToDeleteComment(req);
    const deleted = await deleteCommentSvc(data);
    return res.status(200).json(deleteCommentResponse(deleted));
  } catch (err) {
    const code = err.statusCode ?? 400;
    return res.status(code).json({ message: err.message ?? "bad request" });
  }
};
