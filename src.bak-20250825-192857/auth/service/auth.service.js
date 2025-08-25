import admin from "firebase-admin";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import {
  addFindUser,
  expireRefreshToken,
  findUserById,
  registerRefreshToken,
  updateUser,
} from "../repository/auth.repository.js";
import {
  loginResponseDto,
  logoutResponseDto,
  refreshResponseDto,
  updateProfileResponseDto,
} from "../dto/response/auth.response.dto.js";
import { InvalidInputValueError, InvalidTokenError } from "../../error.js";
export const verifyIdToken = async (data) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(data.idToken);
    const userData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    if (userData.email.split("@").at(-1) !== "skuniv.ac.kr") {
      throw new InvalidInputValueError("학교 계정으로만 가입 가능합니다.");
    }
    const user = await addFindUser(userData);
    const payload = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      grade: user.grade,
      gender: user.gender,
      isCompleted: user.isCompleted,
    };
    const tokens = {
      access: generateAccessToken(payload),
      refresh: generateRefreshToken(payload),
    };
    payload.profileImage = user.profileImg;
    await registerRefreshToken(tokens.refresh);
    return loginResponseDto({ tokens, payload });
  } catch (error) {
    throw new InvalidInputValueError("유효하지 않은 토큰 입니다.");
  }
};
export const logout = async (data) => {
  await expireRefreshToken(data);
  return logoutResponseDto(null);
};
export const refresh = async (data) => {
  const payload = verifyRefreshToken(data.refreshToken);
  if (payload === null) {
    throw new InvalidTokenError("유효하지 않은 토큰 입니다.", null);
  }
  const user = await findUserById(payload.id);
  const newPayload = {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    grade: user.grade,
    gender: user.gender,
    isCompleted: user.isCompleted,
  };
  const accessToken = generateAccessToken(newPayload);
  newPayload.profileImage = user.profileImg;
  return refreshResponseDto({ accessToken, newPayload });
};
export const updateProfile = async (data) => {
  const updatedProfile = await updateUser(data);
  return updateProfileResponseDto(updatedProfile);
};
