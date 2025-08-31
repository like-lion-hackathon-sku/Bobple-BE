// 위치 : src/events/event/dto/response/event.response.dto.js
/* 헬퍼 함수
   모든 요청에 대해 res 객체에 헬퍼 함수를 붙여주는 역할.
   라우터에서 res.success(...), res.fail(...)를 바로 쓸 수 있게 해줌.
*/
export function responseHelpers(req, res, next) {
  // 성공 응답 전용 헬퍼
  res.success = (data, status = 200) =>
    res.status(status).json({ ok: true, data });
  // 실패 응답 전용 핼퍼
  res.fail = (status = 400, message = "Bad Request", extra) =>
    res.status(status).json({ ok: false, error: { message, ...extra } });
  next();
}
