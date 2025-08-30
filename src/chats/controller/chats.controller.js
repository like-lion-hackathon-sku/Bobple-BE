import { StatusCodes } from "http-status-codes";
import { parseListChatsRequest } from "../dto/request/chats.request.dto.js";
import { listChatsSvc } from "../service/chats.service.js";
import { listChatsResponse } from "../dto/response/chats.response.dto.js";

export const listChats = async (req, res, next) => {
  try {
    const dto = parseListChatsRequest(req);
    const result = await listChatsSvc(dto);
    return res.status(StatusCodes.OK).json(listChatsResponse(result));
  } catch (e) {
    // dto에서 status를 설정했으면 그대로 사용
    const code = e.status || StatusCodes.INTERNAL_SERVER_ERROR;
    return res.status(code).json({
      resultType: "FAIL",
      error: { errorCode: "unknown", reason: e.message || "unknown" },
    });
  }
};
