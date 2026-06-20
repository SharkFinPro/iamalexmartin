import { RichText } from '@graphcms/rich-text-react-renderer';
import richTextStyles from './RichText.module.scss';

// Guarantee an `alt` attribute on every CMS image: prefer the asset's authored
// alt text, fall back to its title, and finally to "" (decorative) so a screen
// reader never announces a raw filename/URL. WCAG 1.1.1.
const renderers = {
  img: ({ src, altText, title, width, height }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={altText ?? title ?? ""} width={width} height={height} loading="lazy" />
  ),
  // Column headers in CMS tables get an explicit scope so screen readers
  // associate data cells with their header. WCAG 1.3.1.
  table_header_cell: ({ children }: any) => <th scope="col">{children}</th>
};

type Props = {
  content: any;
  /**
   * "card" (default) wraps the prose in the standalone bordered surface used on
   * the About page. "bare" drops the box so the prose sits inside a larger
   * composition (project case-study blocks) without looking like a widget.
   */
  variant?: "card" | "bare";
};

export default function RichTextWidget({ content, variant = "card" }: Props) {
  return (
    <div className={`${richTextStyles.container} ${variant === "card" ? richTextStyles.card : ""}`}>
      <RichText content={content} renderers={renderers} />
    </div>
  );
}