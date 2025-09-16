// src/reviews/router/reviews.router.js
import express from "express";
import {
  createReview,
  listReviewsOfUser,
} from "../controller/reviews.controller.js";

const router = express.Router({ mergeParams: true });

router.post(
  "/:userId",
  /* #swagger.tags = ['Reviews']
   #swagger.summary = '익명 리뷰 작성'
   #swagger.description = '특정 사용자에게 익명으로 점수 리뷰를 남깁니다.'
   #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    required: ["score"],
                    properties: {
                        score: { type: "number", example: 4 }
                    }
                }
            }
        }
   } */
  createReview
);

// --- GET /:userId API에 대한 주석 ---

router.get(
  "/:userId",
  /* #swagger.tags = ['Reviews']
   #swagger.summary = '특정 유저가 받은 리뷰 목록 조회'
   #swagger.description = '특정 사용자가 받은 리뷰 목록을 조회합니다.' */
  listReviewsOfUser
);

export default router;
