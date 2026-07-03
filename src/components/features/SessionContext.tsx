"use client";

import { createContext, ReactNode, useContext, useEffect } from "react";
import { registerAccount } from "@/lib/posthog";

const SessionTokenContext = createContext<string>("");

export function SessionTokenProvider({
  token,
  children,
}: {
  token: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (typeof payload.accountId === "string") {
        registerAccount(payload.accountId);
      }
    } catch {
      // analytics only — never break the app over a malformed token
    }
  }, [token]);
  return (
    <SessionTokenContext.Provider value={token}>
      {children}
    </SessionTokenContext.Provider>
  );
}

// Client components pass this token as the `sessionToken` arg to Convex functions.
export function useSessionToken() {
  return useContext(SessionTokenContext);
}
