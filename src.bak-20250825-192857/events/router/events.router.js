import express from "express";
import creationRouter from "../creation/router/creation.router.js";
import applicationRouter from "../application/router/application.router.js";
import commentsRouter from "../comments/router/comments.router.js";
import eventRouter from "../event/router/event.router.js";

const router = express.Router({ mergeParams: true });

router.use("/", eventRouter);
router.use("/creation", creationRouter);
router.use("/:eventId/application", applicationRouter);
router.use("/:eventId/comments", commentsRouter);

export default router;
