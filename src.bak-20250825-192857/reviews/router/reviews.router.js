//src/reviews/router/reviews.router.js

import express from "express";
import { createReview, getReview } from "../controller/reviews.controller.js";

const router = express.Router({ mergeParams: true });

/**
 * POST /api/reviews/:userId
 */
router.post(
  "/:userId",
  /*
    #swagger.tags = ['Reviews']
    #swagger.summary = '특정 유저에게 리뷰 등록'
    #swagger.parameters['userId'] = { 
      in: 'path', 
      required: true, 
      schema: { type: 'integer' }, 
      description: '리뷰 대상 유저 ID' 
    }
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { 
            type: 'object', 
            required: ['score'], 
            properties: {
              score: { type: 'number', minimum: 1, maximum: 5, example: 4.5 }
            } 
          }
        }
      }
    }
    #swagger.responses[201] = { description: '리뷰 등록 성공' }
    #swagger.responses[400] = { description: '잘못된 userId 또는 score 값' }
    #swagger.responses[409] = { description: '이미 리뷰 존재' }
    #swagger.responses[500] = { description: '서버 에러' }
*/
  createReview
);

/**
 * GET /api/reviews/:userId
 */
router.get(
  "/:userId",
  /*
    #swagger.tags = ['Reviews']
    #swagger.summary = '특정 유저의 리뷰 조회'
    #swagger.parameters['userId'] = { 
      in: 'path', 
      required: true, 
      schema: { type: 'integer' }, 
      description: '조회 대상 유저 ID' 
    }
    #swagger.responses[200] = {
      description: '리뷰 조회 성공',
      content: {
        "application/json": {
          schema: {
            type: 'object',
            properties: {
              average: { type: 'number', example: 4.2 },
              review: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  userId: { type: 'integer' },
                  score: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
    #swagger.responses[400] = { description: '잘못된 userId' }
    #swagger.responses[404] = { description: '리뷰 없음' }
    #swagger.responses[500] = { description: '서버 에러' }
*/
  getReview
);

export default router;
