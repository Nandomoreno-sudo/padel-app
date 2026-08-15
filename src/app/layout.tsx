import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { Header } from "@/components/header";
import { NotificationsListener } from "@/components/notifications-listener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Padel Club",
  description: "Organiza y apúntate a partidos de pádel del club.",
  applicationName: "Pádel Club",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pádel Club",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0f0d",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let unreadNotifications = 0;
  if (user) {
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),
    ]);
    isAdmin = Boolean(profile?.is_admin);
    unreadNotifications = count ?? 0;
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className={`min-h-full flex flex-col ${user ? "pb-20" : ""}`}
        suppressHydrationWarning
      >
        <Header />
        {children}
        {user && (
          <>
            <NotificationsListener userId={user.id} />
            <BottomNav isAdmin={isAdmin} unreadNotifications={unreadNotifications} />
          </>
        )}
      </body>
    </html>
  );
}
