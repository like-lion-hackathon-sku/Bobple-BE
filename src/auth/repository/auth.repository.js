import { prisma } from "../../db.config.js";
export const addFindUser = async (data) => {
  const isExists = await prisma.users.findUnique({
    where: {
      uid: data.uid,
    },
  });
  if (isExists) return isExists;
  const user = await prisma.users.create({
    data: {
      email: data.email,
      uid: data.uid,
    },
  });
  return user;
};
export const registerRefreshToken = async (token) => {
  return await prisma.refreshTokens.create({
    data: {
      token: token,
    },
  });
};
export const expireRefreshToken = async (data) => {
  if (data.refreshToken === null) return -1;
  const isExists = await prisma.refreshTokens.findFirst({
    where: {
      token: data.refreshToken,
    },
  });
  if (!isExists) return -1;
  return await prisma.refreshTokens.delete({
    where: {
      id: isExists.id,
    },
  });
};
export const findUserById = async (id) => {
  const user = await prisma.users.findFirst({
    where: {
      id: id,
    },
  });
  if (!user) return -1;
  return user;
};
export const updateUser = async (data) => {
  return prisma.users.update({
    data: {
      nickname: data.nickname,
      grade: data.grade,
      gender: data.gender,
      profileImg: data.profileImage,
      isCompleted: true,
    },
    where: {
      id: data.id,
    },
  });
};
