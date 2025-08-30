export const parseListChatsRequest = (req) => {
  const id = Number(req.params.eventId);
  if (!Number.isFinite(id)) {
    const err = new Error("Invalid eventId");
    err.status = 400;
    throw err;
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(100, Math.max(1, Number(req.query.size) || 30));

  return { eventId: id, page, size };
};
