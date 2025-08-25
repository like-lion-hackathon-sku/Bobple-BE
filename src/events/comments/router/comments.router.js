import express from "express";
import {
  createComment,
  listComments,
  deleteComment,
} from "../controller/comments.controller.js";

const router = express.Router({ mergeParams: true });

// POST   /api/events/:eventId/comments
router.post(
  "/",
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = '댓글 작성'
    #swagger.parameters['eventId'] = {
      in: 'path',
      required: true,
      schema: { type: 'integer' },
      description: '이벤트 ID',
      example: 1
    }
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: 'object',
            required: ['creatorId', 'content'],
            properties: {
              creatorId: { type: 'integer', example: 2, description: '작성자(유저) ID' },
              content: { type: 'string', example: '저도 같이 가고 싶습니다!' }
            }
          }
        }
      }
    }
    #swagger.responses[201] = {
      description: '댓글 작성 성공',
      content: { "application/json": { } }
    }
  */
  createComment
);

// GET    /api/events/:eventId/comments
router.get(
  "/",
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = '댓글 리스트 가져오기'
    #swagger.parameters['eventId'] = {
      in: 'path',
      required: true,
      schema: { type: 'integer' },
      description: '이벤트 ID',
      example: 1
    }
    #swagger.parameters['page'] = {
      in: 'query',
      required: false,
      schema: { type: 'integer', default: 1 },
      description: '페이지 번호'
    }
    #swagger.parameters['size'] = {
      in: 'query',
      required: false,
      schema: { type: 'integer', default: 10 },
      description: '페이지 크기'
    }
    #swagger.responses[200] = {
      description: '댓글 목록 조회 성공',
      content: { "application/json": { } }
    }
  */
  listComments
);

// DELETE /api/events/:eventId/comments/:commentId
router.delete(
  "/:commentId",
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = '댓글 삭제'
    #swagger.parameters['eventId'] = {
      in: 'path',
      required: true,
      schema: { type: 'integer' },
      description: '이벤트 ID',
      example: 1
    }
    #swagger.parameters['commentId'] = {
      in: 'path',
      required: true,
      schema: { type: 'integer' },
      description: '댓글 ID',
      example: 3
    }
    #swagger.responses[200] = {
      description: '댓글 삭제 성공',
      content: { "application/json": { } }
    }
    #swagger.responses[404] = {
      description: '해당 댓글을 찾을 수 없음'
    }
  */
  deleteComment
);

export default router;
