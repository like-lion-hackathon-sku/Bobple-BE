import { InvalidInputValueError } from "../../../error.js";

/** GET /api/users/me */
export const parseGetMeRequest = (req) => {
  // auth.middleware.js 가 req.payload 를 세팅함
  // 페이로드 키가 id 또는 userId 인 경우 모두 대응
  const raw = req.payload?.id ?? req.payload?.userId;
  const id = Number(raw);

  if (!Number.isInteger(id) || id <= 0) {
    throw new InvalidInputValueError("유효하지 않은 사용자입니다.", { payload: req.payload });
  }
  return { userId: id };
};

/** GET /api/users/:userId */
export const parseGetUserPublicRequest = (req) => {
  const id = Number(req.params.userId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new InvalidInputValueError("userId 경로 파라미터가 올바르지 않습니다.", {
      userId: req.params.userId,
    });
  }
  return { userId: id };
};
