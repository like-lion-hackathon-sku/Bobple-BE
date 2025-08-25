import express from "express";

const router = express.Router({ mergeParams: true });
router.get("/:eventId", (req, res, next) => {
  res.send("events");
});
export default router;
