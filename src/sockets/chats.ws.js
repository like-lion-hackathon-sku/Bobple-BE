// src/sockets/chats.ws.js
import { WebSocketServer } from "ws";
import { URL } from "url";

import { verifyAccessToken } from "../utils/jwt.js"
import {
  findEventByIdRepo,
  findEventApplicationRepo,
  createChatsRepo,
} from "../chats/repository/chats.repository.js";

// eventId -> Set<ws>
const rooms = new Map();

// 간단 쿠키 파서
function parseCookies(header = "") {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((kv) => {
      const i = kv.indexOf("=");
      if (i < 0) return [kv.trim(), ""];
      return [
        kv.slice(0, i).trim(),
        decodeURIComponent(kv.slice(i + 1).trim()),
      ];
    })
  );
}

// 좀비 소켓 제거용
function heartbeat() {
  this.isAlive = true;
}

/**
 * HTTP 서버에 WebSocket 채팅을 등록한다.
 * - 접속: wss://<host>/ws/chats?eventId=123
 * - 쿠키: accessToken 필수 (verifyAccessToken(payload)에서 id 또는 userId 포함 가정)
 * - 수신: {"type":"chat:send","content":"안녕!"}
 * - 발신: {"type":"chat:new","data":{id,eventId,userId,content,createdAt}}
 */
export default function registerChatWSS(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  // HTTP -> WS 업그레이드 (경로/권한 체크)
  httpServer.on("upgrade", async (req, socket, head) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname !== "/ws/chats") {
        socket.destroy();
        return;
      }

      const eventId = Number(url.searchParams.get("eventId"));
      if (!Number.isInteger(eventId) || eventId < 1) {
        socket.destroy();
        return;
      }

      // 인증: accessToken 쿠키 확인
      const { accessToken } = parseCookies(req.headers.cookie || "");
      if (!accessToken) {
        socket.destroy();
        return;
      }
      const payload = verifyAccessToken(accessToken);
      const userId = payload?.id ?? payload?.userId;
      if (!userId) {
        socket.destroy();
        return;
      }

      // 이벤트 존재/참가자 확인
      const event = await findEventByIdRepo(eventId);
      if (!event) {
        socket.destroy();
        return;
      }
      const isHost = event.creatorId === userId;
      const app = await findEventApplicationRepo({ eventId, userId });
      if (!isHost && !app) {
        socket.destroy();
        return;
      }

      // 업그레이드 성공 → 연결 수립
      wss.handleUpgrade(req, socket, head, (ws) => {
        ws.userId = userId;
        ws.eventId = eventId;
        ws.isAlive = true;
        ws.on("pong", heartbeat);

        // 방 등록
        if (!rooms.has(eventId)) rooms.set(eventId, new Set());
        rooms.get(eventId).add(ws);

        wss.emit("connection", ws, req);
      });
    } catch {
      socket.destroy();
    }
  });

  // 연결 이후 핸들러
  wss.on("connection", (ws) => {
    // 연결 확인용 시스템 메시지
    ws.send(
      JSON.stringify({ type: "system", message: "joined", eventId: ws.eventId })
    );

    // 메시지 수신/저장/브로드캐스트
    ws.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return; // JSON 아님
      }

      if (msg?.type !== "chat:send") return;

      const content = (msg.content ?? "").toString();
      if (content.length < 1 || content.length > 1000) return;

      // DB 저장
      const saved = await createChatsRepo({
        eventId: ws.eventId,
        userId: ws.userId,
        content,
      });

      // 같은 방에 브로드캐스트
      const payload = JSON.stringify({
        type: "chat:new",
        data: {
          id: saved.id,
          eventId: saved.eventId,
          userId: saved.userId,
          content: saved.content,
          createdAt: saved.createdAt,
        },
      });

      const peers = rooms.get(ws.eventId) || new Set();
      for (const peer of peers) {
        if (peer.readyState === peer.OPEN) {
          peer.send(payload);
        }
      }
    });

    ws.on("close", () => {
      const set = rooms.get(ws.eventId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) rooms.delete(ws.eventId);
      }
    });
  });

  // 하트비트(죽은 연결 정리)
  const interval = setInterval(() => {
    for (const set of rooms.values()) {
      for (const ws of set) {
        if (ws.isAlive === false) {
          ws.terminate();
          set.delete(ws);
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }
  }, 30000);

  wss.on("close", () => clearInterval(interval));
}
