import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
        <Image
          src="/icons/icon-192.png"
          alt="Pádel Club"
          width={28}
          height={28}
          className="rounded-full"
          priority
        />
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-foreground"
        >
          Pádel <span className="text-emerald-400">Club</span>
        </Link>
      </div>
    </header>
  );
}
