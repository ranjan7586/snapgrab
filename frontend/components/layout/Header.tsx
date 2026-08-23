import Link from "next/link";
import { Download } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/instagram-video-downloader", label: "Instagram" },
  { href: "/facebook-video-downloader", label: "Facebook" },
  { href: "/youtube-video-downloader", label: "YouTube" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl btn-gradient text-white">
            <Download size={16} strokeWidth={2.5} />
          </span>
          Snapgrab
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
