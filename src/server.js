import http from "http";
import url from "url";
import app from "./app.js";
import { WebSocketServer } from "ws";
import registerChatWSS from "./sockets/chats.ws.js";

// WS 서버(noServer) 생성 후, 우리가 원하는 경로에서만 업그레이드 허용
const wss = new WebSocketServer({ noServer: true });
registerChatWSS(wss);

const server = http.createServer(app);

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

const PORT = process.env.PORT ?? 3000;
server.listen(PORT, () => {
  console.log(`HTTP + WebSocket listening on :${PORT}`);
});
