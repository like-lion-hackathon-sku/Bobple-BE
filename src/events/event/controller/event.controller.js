// 위치: src/events/event/controller/event.controller.js
import { StatusCodes } from "http-status-codes";
import * as svc from "../../service/event.service.js";
import {
  parseListQuery,
  parseEventIdParam,
  parseEditBody,
} from "../../dto/request/event.request.dto.js";

/* 밥약 목록 조회
 * 매서드: GET
 * 엔드포인트: /api/events
 */
export async function list(req, res, next) {
  try {
    const dto = parseListQuery(req.query);
    const events = await svc.list(dto);
    return res.success(events, StatusCodes.OK);
  } catch (e) {
    next(e);
  }
}

/* 밥약 상세 조회
 * 매서드: GET
 * 엔드포인드: /api/events/:eventId
 */
export async function detail(req, res, next) {
  try {
    const { eventId } = parseEventIdParam(req.params);
    const event = await svc.detail(eventId);
    return res.success(event, StatusCodes.OK);
  } catch (e) {
    next(e);
  }
}

/* 밥약 수정
 * 매서드: PUT
 * 엔드포인트: /api/events/:eventId
 */
export async function edit(req, res, next) {
  try {
    const { eventId } = parseEventIdParam(req.params);
    const body = parseEditBody(req.body);
    const updatedEvent = await svc.edit(eventId, body, req.user);
    return res.success(updatedEvent, StatusCodes.OK);
  } catch (e) {
    next(e);
  }
}

/* 밥약 취소(삭제)
 * 매서드: PUT
 * 엔드포인트: /api/events/:eventId/cancel
 */
export async function cancel(req, res, next) {
  try {
    const { eventId } = parseEventIdParam(req.params);
    const result = await svc.cancel(eventId, req.user);
    return res.success(result, StatusCodes.OK);
  } catch (e) {
    next(e);
  }
}
