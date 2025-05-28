import { RichText } from '@graphcms/rich-text-react-renderer';
import styles from './RichText.module.scss';

const CONTENT_QUERY = `
  query Tests {
    tests {
      rich {
        raw
      }
    }
  }
`;

async function getContent() {
  const response = await fetch(process.env.CMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: CONTENT_QUERY
    })
  });
  const json = await response.json();

  return json.data.tests[0].rich.raw;
}

export default async function Page({ params }) {
  const { slug } = await params;

  const content = await getContent();

  return <>
    <h3>Hello, World!</h3>
    <p>{slug}</p>
    {/* @ts-ignore */}
    <div className={styles.container}>
      <RichText content={content} />
    </div>
  </>
}