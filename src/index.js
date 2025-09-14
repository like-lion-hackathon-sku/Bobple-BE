import dotenv from "dotenv";
import { setupSwagger } from "./config/swagger.js";
import { setupCommonError, setupExpress } from "./config/express.js";
import { setupFirebase } from "./config/firebase.js";
import router from "./router/router.js";

dotenv.config();

const app = setupExpress();
const port = process.env.PORT || 3000;

setupFirebase();
setupSwagger(app);

// 요청 로깅 (개발용)
app.use((req, _res, next) => {
  console.log("[REQ]", req.method, req.originalUrl);
  next();
});

app.get("/_ping", (_req, res) => res.json({ ok: true, where: "root" }));

// ✅ 모든 라우터를 한 번에 마운트
app.use(router);

app.get("/_routes", (req, res) => {
  const out = [];
  const stack = req.app?._router?.stack || [];
  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods || {}).map((m) =>
        m.toUpperCase(),
      );
      methods.forEach((m) => out.push(`${m} ${layer.route.path}`));
    } else if (layer.name === "router" && layer.handle?.stack) {
      for (const s of layer.handle.stack) {
        if (s.route) {
          const methods = Object.keys(s.route.methods || {}).map((m) =>
            m.toUpperCase(),
          );
          methods.forEach((m) => out.push(`${m} ${s.route.path}`));
        }
      }
    }
  }
  res.json(out);
});

// ✅ 에러 핸들러는 항상 마지막
setupCommonError(app);

import http from "http";
import registerChatWSS from "./sockets/chats.ws.js";

// ✅ Express의 app.listen(...) 대신 http.Server를 직접 생성해야 합니다.
// 이유: WebSocket은 HTTP Upgrade 요청을 처리해야 하므로 http.Server 객체가 필요합니다.
const server = http.createServer(app);

// ⚙️ 타임아웃 설정
// - keepAliveTimeout: 클라이언트 연결을 유지하는 최대 시간 (61초)
// - headersTimeout: 전체 HTTP 헤더 수신 제한 시간 (65초)
// → 긴 폴링/WS 연결 시 타임아웃 에러 방지
server.keepAliveTimeout = 61_000;
server.headersTimeout = 65_000;

// 🌐 WebSocket 서버 등록
// registerChatWSS 함수 내부에서 "upgrade" 이벤트를 가로채어
// WebSocket 연결을 처리합니다. (경로: /ws/chats)
registerChatWSS(server);

// 🚀 서버 실행
// ⚠️ 주의: port 변수는 이미 선언된 것을 그대로 사용해야 하며,
// 새로운 const port를 재선언하면 충돌이 발생합니다.
server.listen(port, () => {
  console.log(`서버 열림 - 포트 : ${port}`);
});