// src/sockets/chats.ws.js

/**
 * **[Chats]**
 * **<🌐 WebSocket>**
 * ***registerChatWSS***
 * '이벤트 채팅방 WebSocket' 기능의 엔트리포인트입니다.
 * HTTP 서버에 WebSocket 서버를 등록하여, 이벤트별 실시간 채팅 기능을 제공합니다.
 * - 클라이언트는 `wss://<host>/ws/chats?eventId=123` 로 접속합니다.
 * - `accessToken` 쿠키를 이용해 인증을 수행합니다.
 * - 연결 성공 시 방(rooms)에 소켓을 등록하고, 메시지를 주고받습니다.
 * - 수신: `{"type":"chat:send","content":"안녕!"}`
 * - 발신: `{"type":"chat:new","data":{id,eventId,userId,content,createdAt}}`
 * - 일정 주기(30초)로 하트비트를 보내어 죽은 연결을 정리합니다.
 * @param {http.Server} httpServer - 기존 HTTP 서버 객체
 * @returns {void}
 */
import { WebSocketServer } from "ws";
import { URL } from "url";

import { verifyAccessToken } from "../utils/jwt.js";

import {
  findEventByIdRepo,
  findEventApplicationRepo,
  createChatsRepo,
} from "../chats/repository/chats.repository.js";

// eventId -> Set<ws>
/**
 * **[Chats]**
 * **<🗂️ Store>**
 * ***rooms***
 * 이벤트별로 연결된 WebSocket 클라이언트를 관리하는 Map 객체입니다.  
 * - key: eventId (number)  
 * - value: Set<WebSocket> (해당 이벤트 채팅방에 접속한 클라이언트 집합)  
 * @type {Map<number, Set<WebSocket>>}
 */
const rooms = new Map();

/**
 * **[Chats]**
 * **<🛠️ Util>**
 * ***parseCookies***
 * 요청 헤더의 쿠키 문자열을 파싱하여 객체 형태로 변환합니다.  
 * - 입력: `"key1=value1; key2=value2"`  
 * - 출력: `{ key1: "value1", key2: "value2" }`
 * @param {string} header - 쿠키 문자열
 * @returns {Object} - key-value 형태의 쿠키 객체
 */
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


/**
 * **[Chats]**
 * **<🛠️ Util>**
 * ***heartbeat***
 * WebSocket 연결의 생존 여부를 갱신하는 함수입니다.  
 * - 서버가 ping을 보내고 클라이언트가 pong 응답 시 호출됩니다.  
 * - 해당 소켓의 `isAlive` 상태를 `true`로 업데이트합니다.
 * @this {WebSocket}
 * @returns {void}
 */
function heartbeat() {
  this.isAlive = true; 
}

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
