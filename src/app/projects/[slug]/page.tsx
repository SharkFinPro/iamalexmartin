import { notFound } from 'next/navigation'
import { RichText } from '@graphcms/rich-text-react-renderer';
import styles from "./Project.module.scss";
import richTextStyles from './RichText.module.scss';

async function getContent(slug: string) {
  try {
    const response = await fetch(process.env.CMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
        query Tests {
          tests(where: { projectWidget: { title: "${slug}" }}) {
            rich {
              raw
            }
          }
        }
      `
      })
    });
    const json = await response.json();

    return json.data.tests[0].rich.raw;
  } catch (error) {
    notFound();
  }
}

export default async function Page({ params }) {
  const { slug } = await params;

  const content = await getContent(slug);

  return (
    <div className={styles.container}>
      <h1>{slug}</h1>
      <div className={richTextStyles.container}>
        <RichText content={content} />
      </div>
    </div>
  );
}