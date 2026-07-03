"use client";

import { useState } from "react";

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-sm border border-border bg-surface">
      {label && (
        <div className="border-b border-border px-4 py-2 text-xs font-medium tracking-wide text-muted">
          {label}
        </div>
      )}
      <div className="relative">
        <pre className="overflow-x-auto p-4 font-mono text-sm leading-normal text-on-surface">
          <code>{code}</code>
        </pre>
        <button
          onClick={copy}
          className="absolute right-2 top-2 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-muted hover:text-on-surface"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
