import { RichText } from '@graphcms/rich-text-react-renderer';
import richTextStyles from './RichText.module.scss';

export default function RichTextWidget({ content }: { content: any }) {
  return (
    <div className={richTextStyles.container}>
      <RichText content={content} />
    </div>
  );
}