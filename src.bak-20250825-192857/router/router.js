import express from "express";
import authRouter from "../auth/router/auth.router.js";
import chatsRouter from "../chats/router/chats.router.js";
import eventsRouter from "../events/router/events.router.js";
import restaurantsRouter from "../restaurants/router/restaurants.router.js";
import reviewsRouter from "../reviews/router/reviews.router.js";
import usersRouter from "../users/router/users.router.js";
import notificationsRouter from "../notifications/router/notifications.router.js";

const router = express.Router({ mergeParams: true });

router.use("/api/auth", authRouter);
router.use("/api/chats", chatsRouter);
router.use("/api/events", eventsRouter);
router.use("/api/restaurants", restaurantsRouter);
router.use("/api/reviews", reviewsRouter);
router.use("/api/users", usersRouter);
router.use("/api/notifications", notificationsRouter);

export default router;
