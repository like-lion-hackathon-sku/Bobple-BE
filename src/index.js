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

// noServer 모드의 WebSocket 서버 생성
const wss = new WebSocketServer({ noServer: true });
registerChatWSS(wss);

// 업그레이드 허용 경로 제한
server.on("upgrade", (req, socket, head) => {
  const { pathname } = url.parse(req.url);
  console.log("[upgrade] URL:", req.url, "| hdr:", req.headers.upgrade);

  if (pathname && pathname.startsWith("/ws/chats/")) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

app.listen(port, () => {
  console.log(`서버 열림 - 포트 : ${port}`);
});
