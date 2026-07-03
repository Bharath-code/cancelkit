"use client";

import { ReactNode, useEffect } from "react";
import { initPostHog } from "@/lib/posthog";

// Root providers: analytics only. The Convex client is heavy and only the
// authenticated app + demo pages need it — see ConvexClientProvider.
export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);
  return <>{children}</>;
}
