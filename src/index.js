import dotenv from "dotenv";
import http from "http";
import url from "url";
import { WebSocketServer } from "ws";

import { setupSwagger } from "./config/swagger.js";
import { setupCommonError, setupExpress } from "./config/express.js";
import { setupFirebase } from "./config/firebase.js";
import router from "./router/router.js";
import registerChatWSS from "./sockets/chats.ws.js";

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

const server = http.createServer(app);

server.keepAliveTimeout = 61_000;
server.headersTimeout = 65_000;

// [UNCHANGED] noServer 모드의 WebSocket 서버 생성 (HTTP 서버에 붙여 씀)
const wss = new WebSocketServer({ noServer: true });
registerChatWSS(wss);

// [CHANGED] 업그레이드 허용 경로: /ws/chats  또는 /ws/chats/:id  모두 수용
server.on("upgrade", (req, socket, head) => {
  const { pathname } = url.parse(req.url);
  const upgradeHdr = (req.headers.upgrade || "").toLowerCase();
  console.log("[upgrade] URL:", req.url, "| upgrade:", upgradeHdr);

  // 업그레이드 헤더 확인(보수적) + 경로 허용
  const allow =
    upgradeHdr === "websocket" &&
    pathname &&
    (pathname === "/ws/chats" ||
      pathname === "/ws/chats/" ||
      pathname.startsWith("/ws/chats/"));

  if (!allow) {
    try {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    } catch {}
    return socket.destroy();
  }

  // 통과
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

server.listen(port, () => {
  console.log(`서버 열림 - 포트 : ${port}`);
});
