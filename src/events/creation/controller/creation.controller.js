// 위치 : src/events/creation/controller/creation.controller.js
import { parseCreateBody } from "../dto/request/creation.request.dto.js";
import * as svc from "../service/creation.service.js";
import { StatusCodes } from "http-status-codes";

export async function createEvent(req, res, next) {
  try {
    const createDto = parseCreateBody(req.body); // ✅ 명확
    const createdEvent = await svc.createEvent(createDto, req.user); // ✅ 동사+명사
    res.status(StatusCodes.CREATED).success(createdEvent); // 생성이므로 201 권장
  } catch (e) {
    next(e);
  }
}
