import { notFound } from 'next/navigation'
import { RichText } from '@graphcms/rich-text-react-renderer';
import styles from "./Project.module.scss";
import richTextStyles from './RichText.module.scss';

async function getProject(slug: string) {
  try {
    const response = await fetch(process.env.CMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query Projects {
            projects(where: { slug: "${slug.toLowerCase()}" }) {
              title
              projectPageContent {
                raw
              }
            }
          }
        `
      })
    });


    const json = await response.json();

    return json.data.projects[0];
  } catch (error) {
    notFound();
  }
}

export default async function Page({ params }) {
  const { slug } = await params;

  const project = await getProject(slug);

  return (
    <div className={styles.container}>
      <h1>{project.title}</h1>
      <div className={richTextStyles.container}>
        <RichText content={project.projectPageContent.raw} />
      </div>
    </div>
  );
}