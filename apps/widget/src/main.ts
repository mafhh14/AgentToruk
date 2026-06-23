import { ChatWidget } from "./widget";

function bootstrap(): void {
  const script = document.currentScript as HTMLScriptElement | null;
  const orgId = script?.getAttribute("data-org");
  const apiUrl =
    script?.getAttribute("data-api-url") ?? window.location.origin;
  const realtimeUrl = script?.getAttribute("data-realtime-url") ?? undefined;

  if (!orgId) {
    console.error("[AgentToruk] Missing data-org attribute on widget script");
    return;
  }

  const widget = new ChatWidget(orgId, apiUrl, realtimeUrl);
  widget.init();

  (window as unknown as { AgentToruk?: { destroy: () => void } }).AgentToruk = {
    destroy: () => widget.destroy(),
  };
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
