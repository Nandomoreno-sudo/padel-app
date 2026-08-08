import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";

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
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = Boolean(profile?.is_admin);
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body
        className={`min-h-full flex flex-col ${user ? "pb-20" : ""}`}
        suppressHydrationWarning
      >
        {children}
        {user && <BottomNav isAdmin={isAdmin} />}
      </body>
    </html>
  );
}
