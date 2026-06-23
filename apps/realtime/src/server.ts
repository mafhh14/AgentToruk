import { REALTIME_EVENTS, conversationRoom, orgRoom } from "@agenttoruk/realtime/events";
import { verifyRealtimeToken } from "@agenttoruk/realtime/token";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = Number(process.env.REALTIME_PORT ?? 3001);
const SECRET =
  process.env.REALTIME_INTERNAL_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  "dev-realtime-secret";
const CORS_ORIGIN = process.env.REALTIME_CORS_ORIGIN ?? "*";

const app = express();
app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    next(new Error("Authentication required"));
    return;
  }

  const payload = verifyRealtimeToken(token, SECRET);
  if (!payload) {
    next(new Error("Invalid token"));
    return;
  }

  socket.data.auth = payload;
  next();
});

io.on("connection", (socket) => {
  const auth = socket.data.auth;

  socket.join(orgRoom(auth.organizationId));

  if (auth.type === "visitor" && auth.conversationId) {
    socket.join(conversationRoom(auth.conversationId));
  }

  socket.on(
    REALTIME_EVENTS.TYPING,
    (data: { conversationId: string; isTyping: boolean }) => {
      if (!data?.conversationId) return;

      if (auth.type === "visitor" && auth.conversationId !== data.conversationId) {
        return;
      }

      io.to(conversationRoom(data.conversationId)).emit(REALTIME_EVENTS.TYPING, {
        conversationId: data.conversationId,
        role: auth.type === "agent" ? "agent" : "visitor",
        isTyping: !!data.isTyping,
        userName: auth.userName ?? null,
      });
    },
  );
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "agenttoruk-realtime" });
});

app.post("/internal/emit", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token || token !== SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { room, event, payload } = req.body as {
    room?: string;
    event?: string;
    payload?: unknown;
  };

  if (!room || !event) {
    res.status(400).json({ error: "room and event are required" });
    return;
  }

  io.to(room).emit(event, payload);
  res.json({ ok: true });
});

httpServer.listen(PORT, () => {
  console.log(`[AgentToruk Realtime] listening on :${PORT}`);
});
