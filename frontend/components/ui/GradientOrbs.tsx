/** Purely decorative, animated aurora blobs used behind the hero section to
 * give the page that "futuristic" depth without any JS — everything here is
 * plain CSS (see .animate-float-a / -b in globals.css). Marked aria-hidden
 * since it carries no content. */
export function GradientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-60 dark:opacity-40" />
      <div className="animate-float-a absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-2/3 rounded-full bg-accent-violet/25 blur-[110px]" />
      <div className="animate-float-b absolute -top-10 right-0 h-[26rem] w-[26rem] translate-x-1/3 rounded-full bg-accent-fuchsia/20 blur-[110px]" />
      <div className="animate-float-a absolute top-40 left-0 h-[22rem] w-[22rem] -translate-x-1/3 rounded-full bg-accent-cyan/15 blur-[100px]" />
    </div>
  );
}
