"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { capture } from "@/lib/posthog";

const LANGS = ["Node", "Python", "Ruby"] as const;

function snippets(secretPlaceholder: string): Record<(typeof LANGS)[number], string> {
  return {
    Node: `const crypto = require("crypto");
// server-side, when rendering the page with your cancel button:
const hmac = crypto
  .createHmac("sha256", process.env.CANCELKIT_WIDGET_SECRET) // ${secretPlaceholder}
  .update(stripeCustomerId)
  .digest("hex");`,
    Python: `import hashlib, hmac, os
# server-side, when rendering the page with your cancel button:
sig = hmac.new(
    os.environ["CANCELKIT_WIDGET_SECRET"].encode(),  # ${secretPlaceholder}
    stripe_customer_id.encode(),
    hashlib.sha256,
).hexdigest()`,
    Ruby: `require "openssl"
# server-side, when rendering the page with your cancel button:
hmac = OpenSSL::HMAC.hexdigest(
  "SHA256",
  ENV["CANCELKIT_WIDGET_SECRET"], # ${secretPlaceholder}
  stripe_customer_id
)`,
  };
}

export function InstallSnippet({ publicKey }: { publicKey: string }) {
  const [lang, setLang] = useState<(typeof LANGS)[number]>("Node");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const scriptTag = `<script src="${appUrl}/v1/cancelkit.js"
  data-account="${publicKey}"
  data-customer="{{STRIPE_CUSTOMER_ID}}"
  data-hmac="{{HMAC}}"
  data-selector="#your-cancel-button"></script>`;

  return (
    <div className="space-y-6">
      <div onCopyCapture={() => capture("install_snippet_copied", { part: "script" })}>
        <CodeBlock label="1 · Paste before </body> on the page with your cancel button" code={scriptTag} />
      </div>

      <div>
        <div className="mb-2 flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                lang === l
                  ? "border-accent text-on-surface"
                  : "border-border text-muted hover:text-on-surface"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div onCopyCapture={() => capture("install_snippet_copied", { part: "hmac", lang })}>
          <CodeBlock
            label={`2 · Compute the HMAC server-side (${lang})`}
            code={snippets("your widget secret, from below")[lang]}
          />
        </div>
      </div>
    </div>
  );
}
