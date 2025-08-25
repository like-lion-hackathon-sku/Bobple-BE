import { InvalidInputValueError } from "../../error.js";
import { clearTokenCookies, setTokenCookies } from "../../utils/cookie.js";
import { imageToDataURL } from "../../utils/files.js";
import { compressProfileImage } from "../../utils/sharp.js";
import {
  loginRequestDto,
  logoutRequestDto,
  refreshRequestDto,
  updateProfileRequestDto,
} from "../dto/request/auth.request.dto.js";
import {
  logout,
  refresh,
  verifyIdToken,
  updateProfile,
} from "../service/auth.service.js";
import { StatusCodes } from "http-status-codes";

export const handleLogin = async (req, res, next) => {
  /*
    #swagger.summary = "로그인"
    #swagger.tags = ['Auth']
    #swagger.requestBody = {
      required: true,
      content:{
        "application/json" :{
          schema:{
            type:"object",
            properties:{
              idToken:{
                type:"string",
              }
            }
          }
        }
      }
    }
  */
  if (!req.body.idToken) {
    throw new InvalidInputValueError("ID 토큰이 필요합니다.");
  }
  const login = await verifyIdToken(loginRequestDto(req.body));
  setTokenCookies(res, login.tokens.access, login.tokens.refresh);
  res.status(StatusCodes.OK).success(login.user);
};
export const handleLogout = async (req, res, next) => {
  /*
    #swagger.summary = "로그아웃"
    #swagger.tags = ['Auth']
  */
  await logout(logoutRequestDto(req.cookies));
  clearTokenCookies(res);
  res.status(StatusCodes.OK).success(null);
};
export const handleRefresh = async (req, res, next) => {
  /*
    #swagger.summary = "토큰 리프레시"
    #swagger.tags = ['Auth']
  */
  const results = await refresh(refreshRequestDto(req.cookies));
  setTokenCookies(res, results.accessToken, null);
  res.status(StatusCodes.OK).success(results.user);
};
export const handleUpdateProfile = async (req, res, next) => {
  /*
    #swagger.summary = "프로필 설정"
    #swagger.description = "프로필을 설정 / 수정 합니다."
    #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data":{
          schema:{
            type: "object",
            properties: {
              profileImage: {
                type:"string",
                format:"binary"
              },
              nickname :{
                type:"string",
                example:"호시",
              },
              grade: {
                type:"number",
                example: 2,
              },
              gender: {
                type:"string",
                example: "Male"
              }
            }
          }
        }
      }
    }
  */
  console.log(req.payload);
  req.file =
    req.file !== undefined
      ? imageToDataURL(await compressProfileImage(req.file))
      : null;
  const updatedProfile = await updateProfile(
    updateProfileRequestDto(req.body, req.file, req.payload),
  );
  res.status(StatusCodes.OK).success(updatedProfile);
};
