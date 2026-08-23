import { ClipboardPaste, Download, Link2 } from "lucide-react";

const STEPS = [
  {
    icon: Link2,
    title: "1. Copy the link",
    text: "Open the Instagram, Facebook or YouTube post you want and copy its share link.",
  },
  {
    icon: ClipboardPaste,
    title: "2. Paste it above",
    text: "Drop the link into the box and hit Download — we detect the platform automatically.",
  },
  {
    icon: Download,
    title: "3. Pick a quality",
    text: "Choose the resolution or format you want and save it straight to your device.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">How it works</h2>
        <p className="mt-2 text-muted">Three steps. No sign-up, no software, no watermark.</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.title} className="glass rounded-2xl p-6">
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent-violet/12 text-accent-violet">
              <step.icon size={20} />
            </div>
            <h3 className="mt-4 font-display font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
