// 위치 : src/events/creation/repository/creation.repository.js
import { prisma } from "../../../lib/prisma.js";

export const insertEvent = (data) => prisma.events.create({ data });

const { PrismaClient } = client;
export const prisma = new PrismaClient();
