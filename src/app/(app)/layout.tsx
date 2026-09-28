import { cookies } from "next/headers";
import { AppNav } from "@/components/features/AppNav";
import { ConvexClientProvider } from "@/components/features/ConvexClientProvider";
import { SessionTokenProvider } from "@/components/features/SessionContext";
import { SESSION_COOKIE } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value ?? "";

  return (
    <ConvexClientProvider>
      <SessionTokenProvider token={sessionToken}>
        <AppNav />
        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-10 sm:px-6">
          {children}
        </main>
      </SessionTokenProvider>
    </ConvexClientProvider>
  );
}
