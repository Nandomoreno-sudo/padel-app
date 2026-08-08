import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/dal";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <nav className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-2 py-2 text-sm">
          <span className="shrink-0 px-2 py-2 font-semibold text-emerald-400">
            Admin
          </span>
          <Link
            href="/admin"
            className="flex min-h-11 shrink-0 items-center rounded-lg px-3 font-medium text-foreground/90 hover:bg-surface-hover"
          >
            Invitaciones
          </Link>
          <Link
            href="/admin/matches"
            className="flex min-h-11 shrink-0 items-center rounded-lg px-3 font-medium text-foreground/90 hover:bg-surface-hover"
          >
            Partidos
          </Link>
          <Link
            href="/admin/matches/new"
            className="flex min-h-11 shrink-0 items-center rounded-lg px-3 font-medium text-foreground/90 hover:bg-surface-hover"
          >
            Nuevo partido
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
