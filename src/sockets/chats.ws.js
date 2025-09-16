// src/sockets/chats.ws.js

/**
 * **[Chats]**
 * **<🌐 WebSocket>**
 * ***registerChatWSS***
 * '이벤트 채팅방 WebSocket' 기능의 엔트리포인트입니다.
 * - 접속:  wss://<host>/ws/chats?eventId=123  또는  wss://<host>/ws/chats/123
 * - 인증: Subprotocol(`bearer.<JWT>`) → query(`?token=`) → cookie(`accessToken`) 우선순위
 * - 수신: {"type":"chat:send","content":"안녕!"}
 * - 발신: {"type":"chat:new","data":{id,eventId,userId,content,created_at}}
 * - 30초 하트비트로 죽은 연결 정리
 */

import { WebSocketServer } from "ws";
import { URL } from "url";
import { verifyAccessToken } from "../utils/jwt.js";
import {
  findEventByIdRepo,
  findEventApplicationRepo,
  createChatsRepo,
} from "../chats/repository/chats.repository.js";

// eventId -> Set<WebSocket>
const rooms = new Map();

/** 쿠키 파싱 */
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

/** pong 수신 시 생존 표시 */
function heartbeat() {
  this.isAlive = true;
}

/** 업그레이드 거절(이유를 네트워크 탭에 표시) */
function reject(socket, status = 400, text = "Bad Request") {
  try {
    socket.write(
      `HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: ${text.length}\r\n\r\n${text}`
    );
  } catch {}
  socket.destroy();
}

export default function registerChatWSS(httpServer) {
  // Subprotocol을 클라이언트가 제안하면 첫 번째 것을 선택(예: "bearer.<JWT>")
  const wss = new WebSocketServer({
    noServer: true,
    handleProtocols: (protocols /* string[] */) => protocols[0] || false,
  });

  // HTTP -> WS 업그레이드
  httpServer.on("upgrade", async (req, socket, head) => {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const pathname = urlObj.pathname;

      console.log(
        "[WS upgrade]",
        urlObj.toString(),
        "| proto:",
        req.headers["sec-websocket-protocol"] || "(none)",
        "| origin:",
        req.headers.origin || "(none)"
      );

      // (선택) 운영 배포 시 오리진 화이트리스트
      // const ALLOWED_ORIGINS = new Set(["https://bobple.netlify.app"]);
      // const origin = req.headers.origin;
      // if (origin && !ALLOWED_ORIGINS.has(origin)) {
      //   console.warn("[WS reject] bad origin:", origin);
      //   return reject(socket, 403, "Forbidden origin");
      // }

      // eventId: query & path 파라미터 모두 지원
      let eventId = Number(urlObj.searchParams.get("eventId"));
      if (pathname.startsWith("/ws/chats/")) {
        const seg = pathname.split("/").filter(Boolean); // ["ws","chats","123"]
        const idFromPath = Number(seg[2]);
        if (Number.isInteger(idFromPath)) eventId = idFromPath;
      }

      const pathOk =
        pathname === "/ws/chats" ||
        pathname === "/ws/chats/" ||
        pathname.startsWith("/ws/chats/");
      if (!pathOk || !Number.isInteger(eventId) || eventId < 1) {
        console.warn("[WS reject] bad path/eventId:", pathname, eventId);
        return reject(socket, 400, "Invalid path or eventId");
      }

      // 토큰: subprotocol -> query -> cookie
      const protocols = (req.headers["sec-websocket-protocol"] || "")
        .split(",")
        .map((s) => s.trim());

      const tokenFromProtocol = protocols
        .find((p) => p.startsWith("bearer."))
        ?.slice("bearer.".length);
      const tokenFromQuery = urlObj.searchParams.get("token");
      const { accessToken: tokenFromCookie } = parseCookies(
        req.headers.cookie || ""
      );

      const token = tokenFromProtocol || tokenFromQuery || tokenFromCookie;
      if (!token) {
        console.warn("[WS reject] no token");
        return reject(socket, 401, "No token");
      }

      // 토큰 검증
      const payload = verifyAccessToken(token);
      const userId = payload?.id ?? payload?.userId;
      if (!userId) {
        console.warn("[WS reject] invalid token payload");
        return reject(socket, 401, "Invalid token");
      }

      // 이벤트/권한 확인 (주최자 or 참가자)
      const event = await findEventByIdRepo(eventId);
      if (!event) {
        console.warn("[WS reject] event not found:", eventId);
        return reject(socket, 404, "Event not found");
      }
      const isHost = event.creatorId === userId;
      const app = await findEventApplicationRepo({ eventId, userId });
      if (!isHost && !app) {
        console.warn("[WS reject] not a participant:", { eventId, userId });
        return reject(socket, 403, "Not a participant");
      }

      // 업그레이드 성공
      wss.handleUpgrade(req, socket, head, (ws) => {
        ws.userId = userId;
        ws.eventId = eventId;
        ws.isAlive = true;
        ws.on("pong", heartbeat);

        if (!rooms.has(eventId)) rooms.set(eventId, new Set());
        rooms.get(eventId).add(ws);

        console.log("[WS accept] eventId:", eventId, "| userId:", userId);
        wss.emit("connection", ws, req);
      });
    } catch (e) {
      console.error("[WS error in upgrade]", e);
      reject(socket, 500, "Upgrade error");
    }
  });

  // 연결 이후
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

      // 공백/길이 방지
      const content = (msg.content ?? "").toString().trim();
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
          created_at: saved.createdAt, // 프론트 요구에 맞춰 snake_case
        },
      });

      const peers = rooms.get(ws.eventId) || new Set();
      for (const peer of peers) {
        if (peer.readyState === peer.OPEN) peer.send(payload);
      }
    });

    // 종료/에러 시 rooms 정리
    const cleanup = () => {
      const set = rooms.get(ws.eventId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) rooms.delete(ws.eventId);
      }
    };
    ws.on("close", cleanup);
    ws.on("error", cleanup); // error여도 정리
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
