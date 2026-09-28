"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/preview", label: "Preview" },
  { href: "/install", label: "Install" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-ink text-white">
      <nav className="mx-auto flex h-16 max-w-[1120px] items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <Link href="/dashboard" aria-label="CancelKit dashboard" className="shrink-0">
          <Logo onInk />
        </Link>
        <div className="-mx-1 flex flex-1 gap-1 overflow-x-auto whitespace-nowrap px-1 [scrollbar-width:none]">
          {links.map((l) => {
            const on = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={`relative rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  on ? "bg-white/12 font-medium text-white" : "text-[#AAB6C8] hover:text-white"
                }`}
              >
                {l.label}
                {on && <span className="absolute inset-x-3.5 -bottom-[13px] h-[3px] rounded-full bg-marigold" aria-hidden="true" />}
              </Link>
            );
          })}
        </div>
        <form action="/api/auth/logout" method="post" className="shrink-0">
          <button type="submit" className="text-sm text-[#AAB6C8] hover:text-white">
            Log out
          </button>
        </form>
      </nav>
    </header>
  );
}
