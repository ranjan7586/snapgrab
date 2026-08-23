import { Gauge, Layers, Lock, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Gauge,
    title: "Built for speed",
    text: "Media is resolved and streamed straight to your device — no waiting rooms, no ads before your download.",
  },
  {
    icon: Layers,
    title: "Every quality, every format",
    text: "Grab HD video, audio-only tracks, or the original photo — whatever the post has, we surface it.",
  },
  {
    icon: Sparkles,
    title: "Carousels & stories included",
    text: "Multi-photo Instagram carousels are split out automatically so you can download exactly the slide you want.",
  },
  {
    icon: Lock,
    title: "Nothing stored",
    text: "We don't keep copies of your downloads or log what you save — the link is processed and forgotten.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Why Snapgrab</h2>
        <p className="mt-2 text-muted">A downloader that gets out of your way.</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass flex gap-4 rounded-2xl p-6">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-fuchsia/12 text-accent-fuchsia">
              <f.icon size={20} />
            </div>
            <div>
              <h3 className="font-display font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
