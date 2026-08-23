export function AboutSection({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
      <div className="mt-5 space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-muted sm:text-base">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
