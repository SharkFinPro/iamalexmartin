import RichTextWidget from "@/components/RichTextWidget";
import EditableRichText from "@/components/RichTextEditor";

type Props = {
  model: string; // Hygraph model API ID (e.g. "Project")
  id: string; // entry id
  field: string; // RichText field API ID (e.g. "projectPageContent")
  raw: any; // raw rich-text AST ({ children })
  isAdmin: boolean;
};

/**
 * Renders a CMS RichText field. Admins edit it inline; visitors get the
 * unchanged, server-rendered widget (same markup, no client cost or SEO impact).
 */
export default function RichTextField({ model, id, field, raw, isAdmin }: Props) {
  return isAdmin ? (
    <EditableRichText model={model} id={id} field={field} value={raw} />
  ) : (
    <RichTextWidget content={raw} />
  );
}
