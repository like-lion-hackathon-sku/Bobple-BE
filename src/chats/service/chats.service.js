import { listChatsRepo, countChatsRepo } from "../repository/chats.repository.js";

export const listChatsSvc = async ({ eventId, page, size }) => {
  const [items, total] = await Promise.all([
    listChatsRepo({ eventId, page, size }),
    countChatsRepo({ eventId }),
  ]);
  return { page, size, total, items };
};
