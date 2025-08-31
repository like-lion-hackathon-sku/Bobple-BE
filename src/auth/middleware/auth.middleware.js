// src/auth/middleware/auth.middleware.js
import { verifyAccessToken } from "../../utils/jwt.js";
import { InvalidTokenError, LoginRequiredError } from "../../error.js";

/**
 * [Auth] <🔌 Middleware>
 * authenticateAccessToken
 * - 쿠키 accessToken 또는 Authorization: Bearer 를 허용
 * - accessToken이 없으면 401
 * - 검증 성공 시 req.payload, req.user 모두 세팅(호환성)
 */
export const authenticateAccessToken = async (req, res, next) => {
  try {
    // 1) 우선 순위: 쿠키 accessToken
    const { accessToken } = req.cookies || {};
    let token = accessToken;

    // 2) 대안: Authorization: Bearer <JWT>
    const h = req.headers.authorization;
    if (!token && typeof h === "string" && h.startsWith("Bearer ")) {
      token = h.slice(7).trim();
    }

    // 3) accessToken이 전혀 없으면 로그인 필요
    if (!token) {
      const err = new LoginRequiredError("로그인이 필요합니다.");
      err.status = 401;
      return next(err);
    }

    // 4) 토큰 검증
    const payload = verifyAccessToken(token);
    if (!payload) {
      const err = new InvalidTokenError("유효하지 않은 인증 토큰 입니다.");
      err.status = 401;
      return next(err);
    }

    // 5) 호환성: payload와 user 모두 세팅
    req.payload = payload;
    req.user = payload; // 기존 코드들이 req.user 사용하므로 추가

    return next();
  } catch (e) {
    // verifyAccessToken 내부에서 throw 된 경우도 401로 통일
    e.status = 401;
    return next(e);
  }
};

/**
 * [Auth] <🔌 Middleware>
 * identifyAccessToken
 * - 선택적 로그인: 있으면 검증해서 payload/user 세팅, 없거나 무효면 null
 * - 쿠키 accessToken 또는 Authorization: Bearer 허용
 */
export const identifyAccessToken = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies || {};
    let token = accessToken;

    const h = req.headers.authorization;
    if (!token && typeof h === "string" && h.startsWith("Bearer ")) {
      token = h.slice(7).trim();
    }

    if (!token) {
      req.payload = null;
      req.user = null;
      return next();
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      req.payload = null;
      req.user = null;
      return next();
    }

    req.payload = payload;
    req.user = payload;
    return next();
  } catch {
    req.payload = null;
    req.user = null;
    return next();
  }
};

/**
 * [Auth] <🔌 Middleware>
 * verifyUserIsActive
 * - 계정 활성/프로필 완료 여부 검사
 */
export const verifyUserIsActive = (req, res, next) => {
  // req.user 또는 req.payload 어느 쪽이든 확인
  const user = req.user || req.payload;
  if (!user || !user.isCompleted) {
    return next(
      new InvalidTokenError("유효하지 않은 인증 토큰입니다.", req.body),
    );
  }
  next();
};
