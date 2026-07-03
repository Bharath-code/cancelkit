"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/install", label: "Install" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <nav className="mx-auto flex h-14 max-w-[1080px] items-center gap-4 overflow-x-auto whitespace-nowrap px-4 sm:gap-6 sm:px-6">
        <Link href="/dashboard" className="text-sm font-bold tracking-tight">
          CancelKit
        </Link>
        <div className="flex flex-1 gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm ${
                pathname.startsWith(l.href)
                  ? "font-medium text-on-surface"
                  : "text-muted hover:text-on-surface"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <a
          href="/api/auth/logout"
          className="text-sm text-muted hover:text-on-surface"
        >
          Log out
        </a>
      </nav>
    </header>
  );
}
