import { ConvexClientProvider } from "@/components/features/ConvexClientProvider";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
