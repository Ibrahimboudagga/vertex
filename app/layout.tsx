import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { PostHogIdentity } from "./components/posthog-identity";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertex — Learn in plain English",
  description: "Find the exact lessons you need across every Vertex course.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ClerkProvider><PostHogIdentity />{children}</ClerkProvider></body></html>;
}
