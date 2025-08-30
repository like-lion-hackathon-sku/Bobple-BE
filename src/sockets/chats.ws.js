import url from "url";
import { createChatRepo } from "../chats/repository/chats.repository.js";
import { isEventMember } from "../chats/guards/isEventMember.js";
import { verifyAccessToken } from "../utils/jwt.js";

// eventId 별 연결을 보관
const rooms = new Map();
const json = (v) => JSON.stringify(v);
const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };

function joinRoom(ws, eventId) {
  const key = String(eventId);
  if (!rooms.has(key)) rooms.set(key, new Set());
  rooms.get(key).add(ws);
  ws._joinedRooms ??= new Set();
  ws._joinedRooms.add(key);
}
function leaveRoom(ws, eventId) {
  const key = String(eventId);
  const set = rooms.get(key);
  if (set) {
    set.delete(ws);
    if (set.size === 0) rooms.delete(key);
  }
  ws._joinedRooms?.delete(key);
}
function broadcast(eventId, payload, except) {
  const set = rooms.get(String(eventId));
  if (!set) return;
  const msg = json(payload);
  for (const c of set) {
    if (c !== except && c.readyState === 1) c.send(msg);
  }
}

export default function registerChatWSS(wss) {
  const HEARTBEAT_MS = 30000;

  wss.on("connection", async (ws, req) => {
    console.log("[ws] connected:", req.url);

    // ── 1) token(optional, 개발용) + 쿠키 accessToken
    const { query, pathname } = url.parse(req.url, true);
    const token = query?.token ? String(query.token) : null;

    const cookieHeader = req.headers?.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(v => {
        const [k, ...r] = v.trim().split("=");
        return k ? [k, decodeURIComponent(r.join("=") || "")] : [null, null];
      }).filter(([k]) => !!k)
    );

    const cookieToken = cookies.accessToken;
    let payload = null;
    if (token || cookieToken) {
      try {
        payload = verifyAccessToken(token || cookieToken);
      } catch (e) {
        console.warn("[ws] token verify failed:", e?.message ?? e);
        // 개발 단계에서는 게스트로 통과(운영에선 여기서 close 권장)
      }
    }

    // 게스트/유저 컨텍스트
    ws._user = payload
      ? { id: payload.id, nickname: payload.nickname ?? null, isCompleted: payload.isCompleted ?? true }
      : { id: null, nickname: "GUEST", isCompleted: true };

    // 경로의 slug (예: /ws/chats/mock-1) → "mock-1"
    ws._roomSlug = pathname?.split("/").pop();

    // ── 2) 초기 eventId가 쿼리에 있으면 자동 join
    const initialEventId = query?.eventId ? Number(query.eventId) : null;
    if (Number.isFinite(initialEventId)) {
      let ok = true;
      if (ws._user.id) {
        try { ok = await isEventMember(ws._user.id, initialEventId); } catch {}
      }
      if (ok) {
        joinRoom(ws, initialEventId);
        ws.send(json({ type: "join-ack", ok: true, eventId: initialEventId }));
      } else {
        ws.send(json({ type: "join-ack", ok: false, error: "not a member", eventId: initialEventId }));
      }
    }

    // ── 3) 메시지 처리
    ws.on("message", async (raw) => {
      const data = typeof raw === "string" ? raw : raw.toString();
      const msg = safeParse(data);
      if (!msg || typeof msg.type !== "string") {
        ws.send(json({ type: "error", error: "invalid message" }));
        return;
      }

      // join
      if (msg.type === "join") {
        const evId = Number(msg.eventId);
        if (!Number.isFinite(evId)) return ws.send(json({ type: "join-ack", ok: false, error: "Invalid eventId" }));
        let ok = true;
        if (ws._user.id) {
          try { ok = await isEventMember(ws._user.id, evId); } catch {}
        }
        if (!ok) return ws.send(json({ type: "join-ack", ok: false, error: "not a member" }));
        joinRoom(ws, evId);
        ws.send(json({ type: "join-ack", ok: true, eventId: evId }));
        return;
      }

      // send
      if (msg.type === "send") {
        const evId = Number(msg.eventId);
        const content = String(msg.content ?? "").trim();
        if (!Number.isFinite(evId)) return ws.send(json({ type: "send-ack", ok: false, error: "Invalid eventId" }));
        if (!content) return ws.send(json({ type: "send-ack", ok: false, error: "content is required" }));

        // 게스트면 DB 저장 없이 브로드캐스트만 (운영에선 토큰 강제 권장)
        if (!ws._user.id) {
          const tmp = {
            type: "message",
            id: `tmp-${Date.now()}`,
            eventId: evId,
            user: { id: 0, nickname: ws._user.nickname },
            content,
            createdAt: new Date(),
          };
          ws.send(json({ type: "send-ack", ok: true, messageId: tmp.id }));
          broadcast(evId, tmp);
          return;
        }

        try {
          const chat = await createChatRepo({ eventId: evId, userId: ws._user.id, content });
          ws.send(json({ type: "send-ack", ok: true, messageId: chat.id }));
          broadcast(evId, {
            type: "message",
            id: chat.id,
            eventId: chat.eventId,
            user: { id: chat.users.id, nickname: chat.users.nickname },
            content: chat.content,
            createdAt: chat.createdAt,
          });
        } catch (e) {
          ws.send(json({ type: "send-ack", ok: false, error: e?.message ?? "send failed" }));
        }
        return;
      }

      // typing
      if (msg.type === "typing") {
        const evId = Number(msg.eventId);
        if (!Number.isFinite(evId)) return;
        broadcast(evId, {
          type: "typing",
          eventId: evId,
          userId: ws._user.id ?? 0,
          nickname: ws._user.nickname,
          typing: !!msg.typing,
        }, ws);
        return;
      }

      // leave
      if (msg.type === "leave") {
        const evId = Number(msg.eventId);
        if (!Number.isFinite(evId)) return;
        leaveRoom(ws, evId);
        ws.send(json({ type: "leave-ack", ok: true, eventId: evId }));
        return;
      }

      ws.send(json({ type: "error", error: `unknown type: ${msg.type}` }));
    });

    // 종료/에러/하트비트
    ws.on("close", (code, reason) => {
      if (ws._joinedRooms) {
        for (const key of ws._joinedRooms) {
          const set = rooms.get(key);
          if (set) {
            set.delete(ws);
            if (set.size === 0) rooms.delete(key);
          }
        }
      }
      console.warn("[ws] closed:", code, reason?.toString?.() || "");
    });
    ws.on("error", (e) => console.error("[ws] error:", e?.message ?? e));

    ws._alive = true;
    ws.on("pong", () => (ws._alive = true));
  });

  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws._alive) return ws.terminate();
      ws._alive = false;
      try { ws.ping(); } catch {}
    });
  }, HEARTBEAT_MS);
}
