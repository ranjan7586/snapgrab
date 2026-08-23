import Link from "next/link";

const COLUMNS = [
  {
    title: "Downloaders",
    links: [
      { href: "/instagram-video-downloader", label: "Instagram Video Downloader" },
      { href: "/facebook-video-downloader", label: "Facebook Video Downloader" },
      { href: "/youtube-video-downloader", label: "YouTube Video Downloader" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#faq", label: "FAQ" },
      { href: "/#how-it-works", label: "How it works" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-surface-border">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2">
            <div className="font-display text-lg font-bold">Snapgrab</div>
            <p className="mt-2 max-w-xs text-sm text-muted">
              A fast, free way to save public videos and photos from Instagram, Facebook, and
              YouTube in the quality you want.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-semibold text-foreground">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted transition hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-surface-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Snapgrab. For personal, non-commercial use only.</p>
          <p>Only download content you own or have permission to use.</p>
        </div>
      </div>
    </footer>
  );
}
