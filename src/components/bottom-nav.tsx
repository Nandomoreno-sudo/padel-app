"use client";

import Link from "next/link";
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

const BASE_ITEMS = [
  { href: "/", label: "Partidos", Icon: MatchesIcon },
  { href: "/profile", label: "Perfil", Icon: ProfileIcon },
];

const ADMIN_ITEM = { href: "/admin", label: "Admin", Icon: AdminIcon };

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...BASE_ITEMS, ADMIN_ITEM] : BASE_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <ul className="mx-auto flex max-w-md items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  active ? "text-emerald-400" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
