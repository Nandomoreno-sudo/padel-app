"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

function IconWrapper(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

function MatchesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
    </IconWrapper>
  );
}

function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconWrapper {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.5 4.4-5.5 7.5-5.5s6.1 2 7.5 5.5" />
    </IconWrapper>
  );
}

function AdminIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconWrapper {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
    </IconWrapper>
  );
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconWrapper {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </IconWrapper>
  );
}

const BASE_ITEMS = [
  { href: "/", label: "Partidos", Icon: MatchesIcon },
  { href: "/notifications", label: "Avisos", Icon: BellIcon },
  { href: "/profile", label: "Perfil", Icon: ProfileIcon },
];

const ADMIN_ITEM = { href: "/admin", label: "Admin", Icon: AdminIcon };

export function BottomNav({
  isAdmin,
  unreadNotifications = 0,
}: {
  isAdmin: boolean;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const items = isAdmin ? [...BASE_ITEMS, ADMIN_ITEM] : BASE_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 touch-manipulation border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <ul className="mx-auto flex max-w-md items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                prefetch={true}
                className={`relative flex min-h-16 touch-manipulation flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  active ? "text-emerald-400" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className="h-6 w-6" />
                  {href === "/notifications" && unreadNotifications > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </span>
                {label}
                <PendingHint />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Gives the tap instant visual feedback even when navigation hasn't
// finished (e.g. prefetch still in flight): a brief dim, decoupled from
// waiting on the destination route's data. Skipped entirely once the
// route is prefetched, since `pending` never flips true.
function PendingHint() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-lg bg-emerald-400/10 transition-opacity ${
        pending ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
