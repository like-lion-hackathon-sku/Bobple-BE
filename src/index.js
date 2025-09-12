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

// app.listen(...) 쓰지 말고, 반드시 http 서버를 만듭니다.
const server = http.createServer(app);

// (선택) 타임아웃 설정 유지
server.keepAliveTimeout = 61_000;
server.headersTimeout = 65_000;

// WebSocket 붙이기 (업그레이드 처리까지 chats.ws.js 내부에서 함)
registerChatWSS(server);

// ⛔️ const port 재선언 금지! 위에서 선언한 port를 그대로 사용.
server.listen(port, () => {
  console.log(`서버 열림 - 포트 : ${port}`);
});