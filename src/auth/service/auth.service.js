import admin from "firebase-admin";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import {
  addFindUser,
  expireRefreshToken,
  registerRefreshToken,
} from "../repository/auth.repository.js";
import {
  loginResponseDto,
  logoutResponseDto,
} from "../dto/response/auth.response.dto.js";
import { InvalidInputValueError } from "../../error.js";
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
      profileImg: user.profileImg,
      isCompleted: user.isCompleted,
    };
    const tokens = {
      access: generateAccessToken(payload),
      refresh: generateRefreshToken(payload),
    };
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
