import express from "express";
import {
  createComment,
  listComments,
  deleteComment,
} from "../controller/comments.controller.js";

const router = express.Router({ mergeParams: true });

// POST /api/events/:eventId/comments
router.post(
  "/",
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = '댓글 작성'
    #swagger.parameters['eventId'] = {
      in: 'path', required: true, schema: { type: 'integer' }, description: '이벤트 ID', example: 1
    }
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: 'object',
            required: ['content'],
            properties: { content: { type: 'string', example: '밥약 신청합니다!', minLength: 1 } }
          }
        }
      }
    }
    #swagger.responses[201] = { description: '생성 성공' }
    #swagger.responses[400] = { description: '잘못된 eventId/content' }
    #swagger.responses[500] = { description: '서버 에러' }
  */
  createComment
);

// GET /api/events/:eventId/comments
router.get(
  "/",
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = '댓글 리스트 조회'
    #swagger.parameters['eventId'] = {
      in: 'path', required: true, schema: { type: 'integer' }, description: '이벤트 ID', example: 1
    }
    #swagger.parameters['page'] = {
      in: 'query', required: false, schema: { type: 'integer', default: 1, minimum: 1 }, description: '페이지(>=1)'
    }
    #swagger.parameters['limit'] = {
      in: 'query', required: false, schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }, description: '페이지당 개수(1~100)'
    }
    #swagger.responses[200] = {
      description: '조회 성공',
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 3 },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    eventId: { type: 'integer' },
                    creatorId: { type: 'integer' },
                    content: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    }
    #swagger.responses[400] = { description: '잘못된 eventId' }
    #swagger.responses[500] = { description: '서버 에러' }
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
      in: 'path', required: true, schema: { type: 'integer' }, description: '이벤트 ID', example: 1
    }
    #swagger.parameters['commentId'] = {
      in: 'path', required: true, schema: { type: 'integer' }, description: '댓글 ID', example: 10
    }
    #swagger.responses[204] = { description: '삭제 성공(본문 없음)' }
    #swagger.responses[400] = { description: '잘못된 eventId/commentId' }
    #swagger.responses[404] = { description: '댓글 없음' }
    #swagger.responses[500] = { description: '서버 에러' }
  */
  deleteComment
);

export default router;
