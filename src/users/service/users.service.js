import {
  findUserPrivateById,
  findUserPublicById,
} from "../repository/users.repository.js";

/** 내 프로필 조회 */
export const getMyProfileSvc = async ({ userId }) => {
  // 필요 시 여기에서 비즈 규칙(탈퇴 상태 등) 체크 가능
  return findUserPrivateById(userId);
};

/** 공개 프로필 조회 */
export const getPublicProfileSvc = async ({ userId }) => {
  return findUserPublicById(userId);
};
