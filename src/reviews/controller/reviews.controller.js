import {
  bodyToCreateReview,
  validateCreateReview,
  queryToListOptions,
} from "../dto/request/reviews.request.dto.js";
import {
  createReviewSvc,
  listReviewsOfUserSvc,
} from "../service/reviews.service.js";
import {
  createReviewResponse,
  listReviewsResponse,
} from "../dto/response/reviews.response.dto.js";

// POST /api/reviews/:userId  (익명 리뷰 작성: score만 저장)
export const createReview = async (req, res) => {
  try {
    const dto = bodyToCreateReview(req);
    const err = validateCreateReview(dto);
    if (err) return res.status(400).json({ message: err });

    const created = await createReviewSvc(dto);
    return res.status(201).json(createReviewResponse(created));
  } catch (e) {
    console.error(e);
    const code = e.status ?? 500;
    return res.status(code).json({ message: e.message ?? "internal error" });
  }
};

// GET /api/reviews/:userId  (해당 유저가 받은 리뷰 — 기본 2개)
export const listReviewsOfUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { take, page } = queryToListOptions(req); // 기본 take=2
    if (!Number.isInteger(userId) || userId < 1)
      return res.status(400).json({ message: "invalid userId" });

    const result = await listReviewsOfUserSvc({ userId, take, page });
    return res.status(200).json(listReviewsResponse(result));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "internal error" });
  }
};

// GET /api/reviews/me  (로그인한 내가 받은 리뷰 — 기본 2개)
/* export const listMyReceivedReviews = async (req, res) => {
  try {
    const fallbackId = Number(process.env.AUTH_DISABLED_USER_ID ?? 1);
    const userId = fallbackId;
    const { take, page } = queryToListOptions(req); // 기본 take=2
    if (!Number.isInteger(userId) || userId < 1)
      return res.status(400).json({ message: "invalid userId(for /me)" });

    const result = await listReviewsOfUserSvc({ userId, take, page });
    return res.status(200).json(listReviewsResponse(result));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "internal error" });
  }
};
*/