import type { EmbedToLoaderMessage, LoaderToEmbedMessage } from "./types";

// Injected by build.mjs
declare const __APP_URL__: string;
declare const __API_URL__: string;

const HANDSHAKE_TIMEOUT_MS = 3000;
const HEARTBEAT_KEY = "ck_hb_at";
const HEARTBEAT_INTERVAL_MS = 60 * 60 * 1000;

(() => {
  const w = window as unknown as Record<string, unknown>;
  if (w.CancelKit) return; // double-include no-op
  w.CancelKit = { v: 1 };

  const script = document.currentScript as HTMLScriptElement | null;
  if (!script) return;

  const publicKey = script.getAttribute("data-account") || "";
  const customerId = script.getAttribute("data-customer") || "";
  const hmac = script.getAttribute("data-hmac") || "";
  const ts = Number(script.getAttribute("data-ts") || 0);
  const selector =
    script.getAttribute("data-selector") || "[data-cancelkit-trigger]";
  if (!publicKey) return;

  const appOrigin = new URL(__APP_URL__).origin;
  let bypass = false; // true while releasing a click to native behavior
  let disabled = false; // set on failopen — no-op for the rest of the page load
  let openModal: {
    root: HTMLElement;
    cleanup: () => void;
    trigger: HTMLElement;
  } | null = null;

  function beacon(message: string, stack?: string): void {
    try {
      fetch(__API_URL__ + "/widget/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey, message, stack }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* never throw from error reporting */
    }
  }

  function heartbeat(): void {
    try {
      const last = Number(localStorage.getItem(HEARTBEAT_KEY) || 0);
      if (Date.now() - last < HEARTBEAT_INTERVAL_MS) return;
      localStorage.setItem(HEARTBEAT_KEY, String(Date.now()));
      fetch(__API_URL__ + "/widget/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* localStorage may be unavailable — skip silently */
    }
  }

  // Release the original click through to native behavior (fail-open).
  function failOpen(target: HTMLElement): void {
    close();
    bypass = true;
    try {
      target.click();
    } finally {
      bypass = false;
    }
  }

  function close(): void {
    if (openModal) {
      const { trigger } = openModal;
      openModal.cleanup();
      openModal.root.remove();
      openModal = null;
      try {
        trigger.focus(); // WCAG 2.4.3: focus returns to what opened the dialog
      } catch {
        /* detached trigger — nothing to return to */
      }
    }
  }

  // host pages ship aggressive `!important` resets — every style we set must
  // win, so everything goes through setProperty(..., "important")
  function styleImportant(el: HTMLElement, css: string): void {
    for (const decl of css.split(";")) {
      const i = decl.indexOf(":");
      if (i > 0) {
        el.style.setProperty(
          decl.slice(0, i).trim(),
          decl.slice(i + 1).trim(),
          "important"
        );
      }
    }
  }

  function open(target: HTMLElement): void {
    if (openModal) return;

    const root = document.createElement("div");
    styleImportant(
      root,
      "position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(22,24,29,0.4)"
    );
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Manage your subscription");
    const iframe = document.createElement("iframe");
    iframe.src =
      __APP_URL__ + "/embed?" + new URLSearchParams({ pk: publicKey }).toString();
    styleImportant(
      iframe,
      "border:0;width:min(480px,calc(100vw - 32px));height:min(640px,calc(100vh - 32px));border-radius:12px;background:#fff;box-shadow:0 8px 30px rgba(22,24,29,0.12)"
    );
    iframe.setAttribute("title", "Manage your subscription");
    root.appendChild(iframe);

    let ready = false;
    const timer = window.setTimeout(() => {
      if (!ready) {
        beacon("handshake_timeout"); // CSP-blocked iframe or app down
        failOpen(target);
      }
    }, HANDSHAKE_TIMEOUT_MS);

    function onMessage(e: MessageEvent): void {
      if (e.origin !== appOrigin) return; // strict origin check
      const msg = e.data as EmbedToLoaderMessage;
      if (!msg || msg.source !== "cancelkit") return;
      if (msg.type === "ready") {
        ready = true;
        const init: LoaderToEmbedMessage = {
          source: "cancelkit",
          type: "init",
          customerId,
          hmac,
          ts,
        };
        iframe.contentWindow?.postMessage(init, appOrigin);
        iframe.focus(); // move keyboard focus into the dialog
        return;
      }
      if (msg.type === "dismissed") {
        close();
        return;
      }
      if (msg.type === "failopen") {
        disabled = true;
        failOpen(target);
        return;
      }
      if (msg.type === "resolved") {
        if (msg.outcome === "canceled" && msg.cancelFailed) {
          // CancelKit's cancel failed — release native behavior.
          failOpen(target);
        } else {
          close(); // CancelKit already executed the resolution
        }
      }
    }

    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") close();
    }

    window.addEventListener("message", onMessage);
    document.addEventListener("keydown", onKey);
    root.addEventListener("click", (e) => {
      if (e.target === root) close(); // backdrop click = dismiss
    });

    // screen readers and Tab stay out of the page behind the dialog
    const inerted = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && !el.inert
    );
    inerted.forEach((el) => (el.inert = true));

    openModal = {
      root,
      trigger: target,
      cleanup: () => {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        document.removeEventListener("keydown", onKey);
        inerted.forEach((el) => (el.inert = false));
      },
    };
    document.body.appendChild(root);
  }

  // Event delegation on document — survives SPA re-renders.
  document.addEventListener(
    "click",
    (e) => {
      if (bypass || disabled) return;
      let target: HTMLElement | null = null;
      let prevented = false;
      try {
        target = (e.target as HTMLElement)?.closest?.(selector);
        if (!target) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        prevented = true;
        open(target);
      } catch (err) {
        beacon(
          "click_handler_error",
          err instanceof Error ? err.stack : String(err)
        );
        // if we already swallowed the click, release it (fail-open)
        if (prevented && target) failOpen(target);
      }
    },
    true
  );

  heartbeat();
})();
