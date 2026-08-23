import { JsonLd } from "@/components/seo/JsonLd";
import { faqJsonLd } from "@/lib/seo";

export interface FaqItem {
  question: string;
  answer: string;
}

export const DEFAULT_FAQ: FaqItem[] = [
  {
    question: "Is this downloader free to use?",
    answer: "Yes. Paste a link, choose a quality, and download — there's no cost, sign-up, or watermark.",
  },
  {
    question: "Can I download private posts or accounts?",
    answer:
      "No. Only publicly available posts can be processed. Private accounts and content you don't have permission to access are never supported.",
  },
  {
    question: "Which formats and qualities are available?",
    answer:
      "It depends on what the original post offers — typically several video resolutions plus an audio-only option, or the original image for photo posts.",
  },
  {
    question: "Is it legal to download videos this way?",
    answer:
      "Downloading is intended for content you own, have permission to use, or that's covered by fair use in your region — always respect the original creator's rights and the platform's terms of service.",
  },
];

export function FAQ({ items = DEFAULT_FAQ }: { items?: FaqItem[] }) {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <JsonLd data={faqJsonLd(items)} />
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
      </div>

      <div className="mt-10 space-y-3">
        {items.map((item) => (
          <details key={item.question} className="glass group rounded-2xl px-5 py-4">
            <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none">
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span className="shrink-0 text-muted transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
