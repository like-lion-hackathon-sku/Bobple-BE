// src/reviews/repository/reviews.repository.js
import { prisma } from "../../db.config.js";

const baseSelect = { id: true, userId: true, score: true, createdAt: true };

export const findByUserId = async (userId) => {
  return prisma.reviews.findUnique({
    where: { userId },
    select: baseSelect,
  });
};

export const create = async ({ userId, score }) => {
  return prisma.reviews.create({
    data: { userId, score },
    select: baseSelect,
  });
};
