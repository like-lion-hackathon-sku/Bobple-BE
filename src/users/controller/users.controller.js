import { StatusCodes } from "http-status-codes";
import { getMyProfileSvc, getPublicProfileSvc } from "../service/users.service.js";
import {
  parseGetMeRequest,
  parseGetUserPublicRequest,
} from "../dto/request/users.request.dto.js";
import { mapUserPrivate, mapUserPublic } from "../dto/response/users.response.dto.js";

const ok = (res, body, code = StatusCodes.OK) =>
  typeof res.success === "function"
    ? res.status(code).success(body)
    : res.status(code).json(body);

/**
  #swagger.summary = "내 프로필 조회"
  #swagger.tags = ["Users"]
  #swagger.description = "로그인한 사용자의 프로필 정보를 반환합니다."
  #swagger.security = [{ cookieAuth: [] }]
  #swagger.responses[200] = {
    description: "내 프로필 정보",
    schema: {
      id: 1,
      email: "me@bobple.com",
      uid: "firebase-uid-abc",
      nickname: "현준",
      grade: 2,
      gender: "M",
      profileImg: "https://example.com/me.png",
      createdAt: "2025-09-03T12:00:00Z",
      updatedAt: "2025-09-03T12:30:00Z",
      isCompleted: true
    }
  }
*/
export const getMe = async (req, res, next) => {
  try {
    const { userId } = parseGetMeRequest(req);
    const user = await getMyProfileSvc({ userId });
    ok(res, mapUserPrivate(user));
  } catch (err) {
    next(err);
  }
};

/**
  #swagger.summary = "공개 프로필 조회"
  #swagger.tags = ["Users"]
  #swagger.description = "특정 유저의 공개 프로필을 조회합니다. (로그인 불필요)"
  #swagger.parameters["userId"] = {
    in: "path",
    description: "조회할 유저 ID",
    required: true,
    schema: { type: "integer" },
    example: 2
  }
  #swagger.responses[200] = {
    description: "공개 프로필 정보",
    schema: {
      id: 2,
      nickname: "밥플러",
      grade: 3,
      gender: "F",
      profileImg: "https://example.com/avatar.png",
      createdAt: "2025-08-28T09:15:00Z"
    }
  }
*/
export const getUserPublic = async (req, res, next) => {
  try {
    const { userId } = parseGetUserPublicRequest(req);
    const user = await getPublicProfileSvc({ userId });
    ok(res, mapUserPublic(user));
  } catch (err) {
    next(err);
  }
};
