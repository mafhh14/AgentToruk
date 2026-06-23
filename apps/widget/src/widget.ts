import type { WidgetThemeConfig } from "@agenttoruk/shared";

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

export class ChatWidget {
  private container: HTMLElement | null = null;
  private isOpen = false;
  private theme: WidgetThemeConfig = DEFAULT_THEME;
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async init(): Promise<void> {
    await this.loadTheme();
    this.render();
  }

  private async loadTheme(): Promise<void> {
    try {
      const baseUrl =
        document.currentScript?.getAttribute("data-api-url") ??
        "http://localhost:3000";
      const res = await fetch(
        `${baseUrl}/api/v1/widget/config?org=${this.orgId}`,
      );
      if (res.ok) {
        this.theme = { ...DEFAULT_THEME, ...(await res.json()) };
      }
    } catch {
      // Use defaults when API unavailable
    }
  }

  private getResolvedTheme(): "light" | "dark" {
    if (this.theme.themeMode === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return this.theme.themeMode;
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
    `;

    root.innerHTML = `
      <button id="at-launcher" style="
        width: 56px; height: 56px; border-radius: 50%; border: none;
        background: var(--at-primary); color: white; cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-size: 24px;
      ">💬</button>
      <div id="at-panel" style="
        display: none; width: 380px; max-width: calc(100vw - 40px);
        height: 520px; max-height: calc(100vh - 100px);
        background: var(--at-bg); color: var(--at-text);
        border-radius: var(--at-radius); box-shadow: 0 8px 40px rgba(0,0,0,0.18);
        flex-direction: column; overflow: hidden; margin-bottom: 12px;
      ">
        <div style="padding: 16px; background: var(--at-primary); color: white; display: flex; justify-content: space-between; align-items: center;">
          <strong>Support</strong>
          <button id="at-close" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">×</button>
        </div>
        <div id="at-messages" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px;">
          <div style="background:var(--at-agent-bubble); padding:10px 14px; border-radius:var(--at-radius); max-width:85%; align-self:flex-start; font-size:14px;">
            ${this.theme.welcomeMessage}
          </div>
        </div>
        <div style="padding:12px; border-top:1px solid rgba(128,128,128,0.2);">
          <div style="display:flex; gap:8px;">
            <input id="at-input" placeholder="Type a message..." style="
              flex:1; padding:10px 12px; border:1px solid rgba(128,128,128,0.3);
              border-radius:var(--at-radius); background:transparent; color:var(--at-text); font-size:14px;
            " />
            <button id="at-send" style="
              padding:10px 16px; background:var(--at-primary); color:white;
              border:none; border-radius:var(--at-radius); cursor:pointer; font-size:14px;
            ">Send</button>
          </div>
          <button id="at-human" style="
            margin-top:8px; width:100%; padding:8px; background:transparent;
            border:1px solid var(--at-primary); color:var(--at-primary);
            border-radius:var(--at-radius); cursor:pointer; font-size:13px;
          ">Talk to a human</button>
        </div>
        ${this.theme.showPoweredBy ? '<div style="text-align:center;padding:4px;font-size:10px;opacity:0.5;">Powered by AgentToruk</div>' : ""}
      </div>
    `;

    document.body.appendChild(root);

    const launcher = root.querySelector("#at-launcher") as HTMLButtonElement;
    const panel = root.querySelector("#at-panel") as HTMLDivElement;
    const close = root.querySelector("#at-close") as HTMLButtonElement;
    const send = root.querySelector("#at-send") as HTMLButtonElement;
    const input = root.querySelector("#at-input") as HTMLInputElement;
    const messages = root.querySelector("#at-messages") as HTMLDivElement;

    const toggle = (open: boolean) => {
      this.isOpen = open;
      panel.style.display = open ? "flex" : "none";
      launcher.style.display = open ? "none" : "block";
    };

    launcher.onclick = () => toggle(true);
    close.onclick = () => toggle(false);

    const addMessage = (text: string, role: "user" | "agent") => {
      const bubble = document.createElement("div");
      bubble.style.cssText = `
        padding:10px 14px; border-radius:var(--at-radius); max-width:85%;
        font-size:14px; align-self:${role === "user" ? "flex-end" : "flex-start"};
        background:${role === "user" ? "var(--at-user-bubble)" : "var(--at-agent-bubble)"};
        color:${role === "user" ? "white" : "var(--at-text)"};
      `;
      bubble.textContent = text;
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    };

    send.onclick = () => {
      const text = input.value.trim();
      if (!text) return;
      addMessage(text, "user");
      input.value = "";
      setTimeout(() => {
        addMessage(
          "Thanks for your message! The AI agent will be connected in Phase 6.",
          "agent",
        );
      }, 600);
    };

    input.onkeydown = (e) => {
      if (e.key === "Enter") send.click();
    };

    this.container = root;
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
  }
}
