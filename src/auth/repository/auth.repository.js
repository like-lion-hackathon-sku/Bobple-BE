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
