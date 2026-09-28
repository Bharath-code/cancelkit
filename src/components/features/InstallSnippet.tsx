"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { capture } from "@/lib/posthog";

const LANGS = ["Node", "Python", "Ruby"] as const;

// Signature covers customer id + unix timestamp; CancelKit rejects it after 1h.
function snippets(secretPlaceholder: string): Record<(typeof LANGS)[number], string> {
  return {
    Node: `const crypto = require("crypto");
// server-side, each time you render the page with your cancel button:
const ts = Math.floor(Date.now() / 1000);
const hmac = crypto
  .createHmac("sha256", process.env.CANCELKIT_WIDGET_SECRET) // ${secretPlaceholder}
  .update(\`\${stripeCustomerId}.\${ts}\`)
  .digest("hex");`,
    Python: `import hashlib, hmac, os, time
# server-side, each time you render the page with your cancel button:
ts = int(time.time())
sig = hmac.new(
    os.environ["CANCELKIT_WIDGET_SECRET"].encode(),  # ${secretPlaceholder}
    f"{stripe_customer_id}.{ts}".encode(),
    hashlib.sha256,
).hexdigest()`,
    Ruby: `require "openssl"
# server-side, each time you render the page with your cancel button:
ts = Time.now.to_i
hmac = OpenSSL::HMAC.hexdigest(
  "SHA256",
  ENV["CANCELKIT_WIDGET_SECRET"], # ${secretPlaceholder}
  "#{stripe_customer_id}.#{ts}"
)`,
  };
}

export function ScriptTagSnippet({ publicKey }: { publicKey: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const scriptTag = `<script src="${appUrl}/v1/cancelkit.js"
  data-account="${publicKey}"
  data-customer="{{STRIPE_CUSTOMER_ID}}"
  data-hmac="{{HMAC}}"
  data-ts="{{TS}}"
  data-selector="#your-cancel-button"></script>`;

  return (
    <div onCopyCapture={() => capture("install_snippet_copied", { part: "script" })}>
      <CodeBlock label="HTML, before </body>" code={scriptTag} />
    </div>
  );
}

export function HmacSnippet() {
  const [lang, setLang] = useState<(typeof LANGS)[number]>("Node");

  return (
    <div>
      <div className="mb-3 inline-flex rounded-full border border-border bg-surface p-1" role="group" aria-label="Server language">
        {LANGS.map((l) => (
          <button
            key={l}
            aria-pressed={lang === l}
            onClick={() => setLang(l)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              lang === l ? "bg-ink text-white" : "text-muted hover:text-on-surface"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <div onCopyCapture={() => capture("install_snippet_copied", { part: "hmac", lang })}>
        <CodeBlock label={`${lang}, server-side`} code={snippets("your widget secret, from below")[lang]} />
      </div>
    </div>
  );
}
