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
    <div className="overflow-hidden rounded-lg bg-ink text-white shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <span className="text-[13px] text-[#AAB6C8]">{label}</span>
        <button
          onClick={copy}
          aria-live="polite"
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            copied ? "bg-jade text-white" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-[#E4EAF3]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
