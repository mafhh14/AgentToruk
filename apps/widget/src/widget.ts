import type { WidgetThemeConfig } from "@agenttoruk/shared";
import { REALTIME_EVENTS } from "@agenttoruk/realtime/events";
import { io, type Socket } from "socket.io-client";

const DEFAULT_THEME: WidgetThemeConfig = {
  welcomeMessage: "Hi! How can I help you today?",
  position: "bottom-right",
  themeMode: "auto",
  allowUserThemeToggle: true,
  light: {
    primary: "#2563eb",
    background: "#ffffff",
    text: "#1f2937",
    agentBubble: "#f3f4f6",
    userBubble: "#2563eb",
  },
  dark: {
    primary: "#3b82f6",
    background: "#111827",
    text: "#f9fafb",
    agentBubble: "#1f2937",
    userBubble: "#2563eb",
  },
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "md",
  borderRadius: 12,
  showPoweredBy: true,
};

interface WidgetMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export class ChatWidget {
  private container: HTMLElement | null = null;
  private theme: WidgetThemeConfig = DEFAULT_THEME;
  private orgId: string;
  private apiUrl: string;
  private realtimeUrl: string;
  private conversationId: string | null = null;
  private visitorId: string;
  private messagesEl: HTMLDivElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private sendBtn: HTMLButtonElement | null = null;
  private typingEl: HTMLDivElement | null = null;
  private isSending = false;
  private isEscalated = false;
  private socket: Socket | null = null;
  private messageIds = new Set<string>();
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(orgId: string, apiUrl: string, realtimeUrl?: string) {
    this.orgId = orgId;
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.realtimeUrl =
      realtimeUrl?.replace(/\/$/, "") ?? this.apiUrl.replace(/:\d+$/, ":3001");
    this.visitorId = this.getOrCreateVisitorId();
  }

  private getOrCreateVisitorId(): string {
    const key = `at_visitor_${this.orgId}`;
    let id = localStorage.getItem(key);
    if (!id) {
      id = `v_${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(key, id);
    }
    return id;
  }

  private getConversationStorageKey(): string {
    return `at_conversation_${this.orgId}`;
  }

  async init(): Promise<void> {
    await this.loadTheme();
    this.render();
    await this.ensureConversation();
    await this.loadMessages();
    if (this.isEscalated) {
      await this.connectRealtime();
    }
  }

  private async loadTheme(): Promise<void> {
    try {
      const res = await fetch(
        `${this.apiUrl}/api/v1/widget/config?org=${this.orgId}`,
      );
      if (res.ok) {
        this.theme = { ...DEFAULT_THEME, ...(await res.json()) };
      }
    } catch {
      // defaults
    }
  }

  private async ensureConversation(): Promise<void> {
    const stored = localStorage.getItem(this.getConversationStorageKey());
    if (stored) {
      this.conversationId = stored;
      return;
    }

    try {
      const res = await fetch(`${this.apiUrl}/api/v1/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: this.orgId,
          visitorId: this.visitorId,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          conversation: { id: string };
        };
        this.conversationId = data.conversation.id;
        localStorage.setItem(
          this.getConversationStorageKey(),
          this.conversationId,
        );
      }
    } catch (error) {
      console.error("[AgentToruk] Failed to create conversation", error);
    }
  }

  private async loadMessages(): Promise<void> {
    if (!this.conversationId || !this.messagesEl) return;

    try {
      const res = await fetch(
        `${this.apiUrl}/api/v1/conversations/${this.conversationId}/messages?organizationId=${this.orgId}`,
      );

      if (!res.ok) return;

      const data = (await res.json()) as {
        conversation?: { status: string };
        messages: WidgetMessage[];
      };

      if (data.conversation?.status === "ESCALATED") {
        this.isEscalated = true;
      }

      this.messagesEl.innerHTML = "";
      this.messageIds.clear();
      this.appendWelcome();

      for (const msg of data.messages) {
        this.messageIds.add(msg.id);
        this.renderMessage(msg.content, this.mapRole(msg.role));
      }
    } catch {
      // keep welcome only
    }
  }

  private mapRole(role: string): "user" | "agent" | "human" {
    if (role === "USER") return "user";
    if (role === "HUMAN") return "human";
    return "agent";
  }

  private async connectRealtime(): Promise<void> {
    if (!this.conversationId || this.socket) return;

    try {
      const params = new URLSearchParams({
        organizationId: this.orgId,
        conversationId: this.conversationId,
        visitorId: this.visitorId,
      });

      const res = await fetch(
        `${this.apiUrl}/api/v1/realtime/token?${params}`,
      );
      if (!res.ok) return;

      const data = (await res.json()) as { token: string; url: string };
      const url = data.url || this.realtimeUrl;

      this.socket = io(url, {
        auth: { token: data.token },
        transports: ["websocket", "polling"],
      });

      this.socket.on(REALTIME_EVENTS.MESSAGE_NEW, (msg: WidgetMessage & { conversationId: string }) => {
        if (msg.conversationId !== this.conversationId) return;
        if (this.messageIds.has(msg.id)) return;
        this.messageIds.add(msg.id);

        if (msg.role === "HUMAN") {
          this.renderMessage(msg.content, "human");
        } else if (msg.role === "ASSISTANT" || msg.role === "SYSTEM") {
          this.renderMessage(msg.content, "agent");
        }
      });

      this.socket.on(
        REALTIME_EVENTS.TYPING,
        (payload: { conversationId: string; role: string; isTyping: boolean }) => {
          if (payload.conversationId !== this.conversationId) return;
          if (payload.role !== "agent" || !this.typingEl) return;
          this.typingEl.style.display = payload.isTyping ? "block" : "none";
          if (payload.isTyping) {
            this.typingEl.textContent = "Agent is typing...";
          }
        },
      );

      this.socket.on(REALTIME_EVENTS.CONVERSATION_CLAIMED, () => {
        this.renderMessage(
          "A support agent has joined the chat.",
          "agent",
        );
      });
    } catch (error) {
      console.error("[AgentToruk] Realtime connection failed", error);
    }
  }

  private emitTyping(isTyping: boolean): void {
    if (!this.socket || !this.conversationId) return;
    this.socket.emit(REALTIME_EVENTS.TYPING, {
      conversationId: this.conversationId,
      isTyping,
    });
  }

  private getResolvedTheme(): "light" | "dark" {
    if (this.theme.themeMode === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return this.theme.themeMode;
  }

  private appendWelcome(): void {
    if (!this.messagesEl) return;
    const el = document.createElement("div");
    el.style.cssText = `
      background:var(--at-agent-bubble); padding:10px 14px; border-radius:var(--at-radius);
      max-width:85%; align-self:flex-start; font-size:14px;
    `;
    el.textContent = this.theme.welcomeMessage;
    this.messagesEl.appendChild(el);
  }

  private render(): void {
    const mode = this.getResolvedTheme();
    const colors = mode === "dark" ? this.theme.dark : this.theme.light;

    const root = document.createElement("div");
    root.id = "agenttoruk-widget";
    root.style.cssText = `
      --at-primary: ${colors.primary};
      --at-bg: ${colors.background};
      --at-text: ${colors.text};
      --at-agent-bubble: ${colors.agentBubble};
      --at-user-bubble: ${colors.userBubble};
      --at-radius: ${this.theme.borderRadius}px;
      --at-font: ${this.theme.fontFamily};
      position: fixed;
      ${this.theme.position === "bottom-left" ? "left: 20px" : "right: 20px"};
      bottom: 20px;
      z-index: 99999;
      font-family: var(--at-font);
      display: flex;
      flex-direction: column;
      align-items: ${this.theme.position === "bottom-left" ? "flex-start" : "flex-end"};
    `;

    root.innerHTML = `
      <div id="at-panel" style="
        display: none; width: 380px; max-width: calc(100vw - 40px);
        height: 520px; max-height: calc(100vh - 100px);
        background: var(--at-bg); color: var(--at-text);
        border-radius: var(--at-radius); box-shadow: 0 8px 40px rgba(0,0,0,0.18);
        flex-direction: column; overflow: hidden; margin-bottom: 12px;
      ">
        <div style="padding: 16px; background: var(--at-primary); color: white; display: flex; justify-content: space-between; align-items: center;">
          <strong>Support</strong>
          <button id="at-close" type="button" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">×</button>
        </div>
        <div id="at-messages" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px;"></div>
        <div id="at-typing" style="display:none; padding:0 16px 8px; font-size:12px; color:var(--at-text); opacity:0.6;">Agent is typing...</div>
        <div style="padding:12px; border-top:1px solid rgba(128,128,128,0.2);">
          <div style="display:flex; gap:8px;">
            <input id="at-input" placeholder="Type a message..." style="
              flex:1; padding:10px 12px; border:1px solid rgba(128,128,128,0.3);
              border-radius:var(--at-radius); background:transparent; color:var(--at-text); font-size:14px;
            " />
            <button id="at-send" type="button" style="
              padding:10px 16px; background:var(--at-primary); color:white;
              border:none; border-radius:var(--at-radius); cursor:pointer; font-size:14px;
            ">Send</button>
          </div>
          <button id="at-human" type="button" style="
            margin-top:8px; width:100%; padding:8px; background:transparent;
            border:1px solid var(--at-primary); color:var(--at-primary);
            border-radius:var(--at-radius); cursor:pointer; font-size:13px;
          ">Talk to a human</button>
        </div>
        ${this.theme.showPoweredBy ? '<div style="text-align:center;padding:4px;font-size:10px;opacity:0.5;">Powered by AgentToruk</div>' : ""}
      </div>
      <button id="at-launcher" type="button" style="
        width: 56px; height: 56px; border-radius: 50%; border: none;
        background: var(--at-primary); color: white; cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-size: 24px;
      ">💬</button>
    `;

    document.body.appendChild(root);

    const launcher = root.querySelector("#at-launcher") as HTMLButtonElement;
    const panel = root.querySelector("#at-panel") as HTMLDivElement;
    const close = root.querySelector("#at-close") as HTMLButtonElement;
    this.sendBtn = root.querySelector("#at-send") as HTMLButtonElement;
    this.inputEl = root.querySelector("#at-input") as HTMLInputElement;
    this.messagesEl = root.querySelector("#at-messages") as HTMLDivElement;
    const humanBtn = root.querySelector("#at-human") as HTMLButtonElement;
    this.typingEl = root.querySelector("#at-typing") as HTMLDivElement;

    this.appendWelcome();

    const toggle = (open: boolean) => {
      panel.style.display = open ? "flex" : "none";
      launcher.style.display = open ? "none" : "block";
    };

    launcher.onclick = () => toggle(true);
    close.onclick = () => toggle(false);

    this.sendBtn.onclick = () => this.sendMessage();
    this.inputEl.onkeydown = (e) => {
      if (e.key === "Enter") this.sendMessage();
    };
    this.inputEl.oninput = () => {
      if (!this.isEscalated) return;
      this.emitTyping(true);
      if (this.typingTimeout) clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => this.emitTyping(false), 1500);
    };

    humanBtn.onclick = () => this.escalate();

    this.container = root;
  }

  private renderMessage(
    text: string,
    role: "user" | "agent" | "human",
  ): void {
    if (!this.messagesEl) return;
    const bubble = document.createElement("div");
    const isUser = role === "user";
    const isHuman = role === "human";
    bubble.style.cssText = `
      padding:10px 14px; border-radius:var(--at-radius); max-width:85%;
      font-size:14px; align-self:${isUser ? "flex-end" : "flex-start"};
      background:${isUser ? "var(--at-user-bubble)" : isHuman ? "#d1fae5" : "var(--at-agent-bubble)"};
      color:${isUser ? "white" : isHuman ? "#065f46" : "var(--at-text)"};
    `;
    bubble.textContent = text;
    this.messagesEl.appendChild(bubble);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private async sendMessage(): Promise<void> {
    if (!this.inputEl || !this.conversationId || this.isSending) return;

    const text = this.inputEl.value.trim();
    if (!text) return;

    this.isSending = true;
    this.inputEl.value = "";
    this.renderMessage(text, "user");
    this.emitTyping(false);

    if (!this.isEscalated && this.typingEl) {
      this.typingEl.style.display = "block";
      this.typingEl.textContent = "Agent is typing...";
    }

    try {
      const res = await fetch(
        `${this.apiUrl}/api/v1/conversations/${this.conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: this.orgId,
            content: text,
          }),
        },
      );

      if (res.ok) {
        const data = (await res.json()) as {
          assistantMessage?: { id: string; content: string } | null;
          handoff?: boolean;
          escalated?: boolean;
        };

        if (data.handoff || data.escalated) {
          this.isEscalated = true;
          await this.connectRealtime();
        }

        if (data.assistantMessage?.content) {
          this.messageIds.add(data.assistantMessage.id ?? `a-${Date.now()}`);
          this.renderMessage(data.assistantMessage.content, "agent");
        } else if (this.isEscalated) {
          // Waiting for human — no auto-reply
        }
      } else {
        this.renderMessage(
          "Sorry, something went wrong. Please try again.",
          "agent",
        );
      }
    } catch {
      this.renderMessage(
        "Connection error. Please check your network.",
        "agent",
      );
    } finally {
      if (this.typingEl) this.typingEl.style.display = "none";
      this.isSending = false;
    }
  }

  private async escalate(): Promise<void> {
    if (!this.conversationId || this.isSending) return;

    this.isSending = true;
    if (this.typingEl) this.typingEl.style.display = "block";

    try {
      const res = await fetch(
        `${this.apiUrl}/api/v1/conversations/${this.conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: this.orgId,
            action: "escalate",
          }),
        },
      );

      if (res.ok) {
        this.isEscalated = true;
        await this.connectRealtime();

        const data = (await res.json()) as {
          message?: { id: string; content: string };
        };
        if (data.message?.content) {
          if (data.message.id) this.messageIds.add(data.message.id);
          this.renderMessage(data.message.content, "agent");
        }
      }
    } finally {
      if (this.typingEl) this.typingEl.style.display = "none";
      this.isSending = false;
    }
  }

  destroy(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.container?.remove();
    this.container = null;
  }
}
