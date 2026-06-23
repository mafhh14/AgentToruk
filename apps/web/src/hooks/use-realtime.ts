"use client";

import type { RealtimeTypingPayload } from "@agenttoruk/realtime/events";
import { REALTIME_EVENTS } from "@agenttoruk/realtime/events";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

interface RealtimeMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: string;
  authorName?: string | null;
}

interface UseRealtimeOptions {
  enabled?: boolean;
  onMessage?: (message: RealtimeMessage) => void;
  onTyping?: (payload: RealtimeTypingPayload) => void;
  onEscalated?: () => void;
  onClaimed?: () => void;
  onQueueUpdated?: () => void;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function connect() {
      try {
        const res = await fetch("/api/realtime/token");
        if (!res.ok || cancelled) return;

        const data = (await res.json()) as { token: string; url: string };
        const socket = io(data.url, {
          auth: { token: data.token },
          transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        socket.on(REALTIME_EVENTS.MESSAGE_NEW, (payload: RealtimeMessage) => {
          optionsRef.current.onMessage?.(payload);
        });

        socket.on(REALTIME_EVENTS.TYPING, (payload: RealtimeTypingPayload) => {
          optionsRef.current.onTyping?.(payload);
        });

        socket.on(REALTIME_EVENTS.CONVERSATION_ESCALATED, () => {
          optionsRef.current.onEscalated?.();
        });

        socket.on(REALTIME_EVENTS.CONVERSATION_CLAIMED, () => {
          optionsRef.current.onClaimed?.();
        });

        socket.on(REALTIME_EVENTS.QUEUE_UPDATED, () => {
          optionsRef.current.onQueueUpdated?.();
        });
      } catch (error) {
        console.error("[realtime]", error);
      }
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  function emitTyping(conversationId: string, isTyping: boolean) {
    socketRef.current?.emit(REALTIME_EVENTS.TYPING, { conversationId, isTyping });
  }

  return { connected, emitTyping };
}
