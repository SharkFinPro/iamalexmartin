// JSON-escape "<" so CMS-sourced strings can never close the script element
// and inject markup. Built at module scope; the sequence is assembled from
// pieces so editor/codegen tooling can't collapse it into a literal character.
const ESCAPED_LT = "\\" + "u003c";

/**
 * Renders a JSON-LD structured-data block (schema.org). Accepts a single
 * schema object or an array of them — search engines accept both forms in
 * one script element.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, ESCAPED_LT) }}
    />
  );
}
