// src/reviews/controller/reviews.controller.js
import { prisma } from "../../db.config.js";

/**
 * POST /api/reviews/:userId
 * body: { score: number(1..5) }
 * 등록만 허용, 기존 리뷰가 있으면 409 Conflict (갱신 X)
 * ※ 인증 미사용 버전: req.user 사용 안 함
 */
export const createReview = async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);
    const score = Number(req.body?.score);

    // userId 유효성
    if (!Number.isInteger(targetUserId) || targetUserId < 1) {
      return res.status(400).json({ message: "invalid userId" });
    }

    // score 유효성
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: "score must be between 1 and 5" });
    }

    // 기존 리뷰 확인 (userId UNIQUE)
    const existing = await prisma.reviews.findUnique({
      where: { user_id: targetUserId },
      select: { id: true, user_id: true, score: true, createdAt: true },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "review already exists", review: existing });
    }

    // 생성
    const review = await prisma.reviews.create({
      data: { user_id: targetUserId, score },
      select: { id: true, user_id: true, score: true, createdAt: true },
    });

    return res.status(201).json(review);
  } catch (err) {
    // UNIQUE 충돌(동시성)
    if (err?.code === "P2002" && err?.meta?.target?.includes("user_id")) {
      return res.status(409).json({ message: "review already exists" });
    }
    console.error("[createReview]", err);
    return res.status(500).json({ message: "internal error" });
  }
};

/**
 * GET /api/reviews/:userId
 * 모델 특성상 userId UNIQUE → 평균 = 저장된 점수
 * ※ 인증 미사용 버전: req.user 사용 안 함
 */
export const getReview = async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);

    // userId 유효성
    if (!Number.isInteger(targetUserId) || targetUserId < 1) {
      return res.status(400).json({ message: "invalid userId" });
    }

    const review = await prisma.reviews.findUnique({
      where: { user_id: targetUserId },
      select: { id: true, user_id: true, score: true, createdAt: true },
    });

    if (!review) {
      return res.status(404).json({ message: "review not found" });
    }

    return res.json({
      average: review.score,
      review, // { id, userId, score, createdAt }
    });
  } catch (err) {
    console.error("[getReview]", err);
    return res.status(500).json({ message: "internal error" });
  }
};
