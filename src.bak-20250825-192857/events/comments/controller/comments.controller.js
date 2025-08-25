import { prisma } from "../../../db.config.js";

/**
 * POST /api/events/:eventId/comments
 * body: { content: string }
 */
export const createComment = async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const creatorId = Number(req.user?.id);
    const content = String(req.body?.content ?? "").trim();

    if (!Number.isInteger(eventId) || eventId < 1) {
      return res.status(400).json({ message: "invalid eventId" });
    }
    if (!creatorId) {
      return res.status(401).json({ message: "unauthorized" });
    }
    if (!content) {
      return res.status(400).json({ message: "content is required" });
    }
    if (content.length > 1000) {
      return res.status(400).json({ message: "content must be <= 1000 chars" });
    }

    const exists = await prisma.events.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!exists) return res.status(404).json({ message: "event not found" });

    const comment = await prisma.comments.create({
      data: { eventId, creatorId, content },
      select: {
        id: true,
        eventId: true,
        creatorId: true,
        content: true,
        createdAt: true,
      },
    });

    return res.status(201).json(comment);
  } catch (err) {
    console.error("[createComment]", err);
    return res.status(500).json({ message: "internal error" });
  }
};

/**
 * GET /api/events/:eventId/comments
 * query: page(1..), limit(1..100)
 */
export const listComments = async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId < 1) {
      return res.status(400).json({ message: "invalid eventId" });
    }

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.comments.findMany({
        where: { eventId },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        select: {
          id: true,
          eventId: true,
          creatorId: true,
          content: true,
          createdAt: true,
        },
      }),
      prisma.comments.count({ where: { eventId } }),
    ]);

    return res.json({ page, limit, total, items });
  } catch (err) {
    console.error("[listComments]", err);
    return res.status(500).json({ message: "internal error" });
  }
};

/**
 * DELETE /api/events/:eventId/comments/:commentId
 * 작성자만 삭제 가능
 */
export const deleteComment = async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const commentId = Number(req.params.commentId);
    const userId = Number(req.user?.id);

    if (!userId) return res.status(401).json({ message: "unauthorized" });
    if (!Number.isInteger(eventId) || eventId < 1) {
      return res.status(400).json({ message: "invalid eventId" });
    }
    if (!Number.isInteger(commentId) || commentId < 1) {
      return res.status(400).json({ message: "invalid commentId" });
    }

    const comment = await prisma.comments.findFirst({
      where: { id: commentId, eventId },
      select: { id: true, creatorId: true },
    });

    if (!comment) return res.status(404).json({ message: "comment not found" });
    if (comment.creatorId !== userId)
      return res.status(403).json({ message: "forbidden" });

    await prisma.comments.delete({ where: { id: commentId } });
    return res.status(204).send();
  } catch (err) {
    console.error("[deleteComment]", err);
    return res.status(500).json({ message: "internal error" });
  }
};