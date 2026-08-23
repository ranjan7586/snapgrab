import type { Metadata } from "next";

export const SITE_NAME = "Snapgrab";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://snapgrab.example.com";
export const SITE_TAGLINE = "Download Instagram, Facebook & YouTube videos in seconds";

interface PageSeoInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

/** Central place to build consistent, keyword-rich metadata for every route.
 * Keeping this in one function means every page automatically gets a
 * canonical URL, Open Graph tags, and Twitter card without repeating
 * boilerplate on each page.tsx. */
export function pageSeo({ title, description, path, keywords }: PageSeoInput): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      // No explicit `images` here on purpose — the sibling
      // opengraph-image.tsx file convention generates and injects it
      // automatically for whichever route segment is being rendered.
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?url={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareAppJsonLd(input: { name: string; description: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
