/** Renders a <script type="application/ld+json"> tag from a plain object.
 * Kept as a tiny server component so every page can drop in structured data
 * without repeating the JSON.stringify + dangerouslySetInnerHTML boilerplate. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
