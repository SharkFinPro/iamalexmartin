import styles from "./Footer.module.scss";
import { camelCaseToSentence } from "@/utils/string";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";
import { cmsQuery } from "@/lib/cms";

const PROJECTS_TYPES_QUERY = `
  query ProjectTypes {
    __type(name: "ProjectTypes") {
      enumValues {
        name
      }
    }
  }
`;

function Social() {
  return (
    <div className={styles.social}>
      <p>Alexander Martin</p>
      <div className={styles.icons}>
        <Link
          href="https://github.com/SharkFinPro"
          aria-label="Alex Martin's GitHub Profile"
          title="Alex Martin's GitHub Profile"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faGithub} />
        </Link>
        <Link
          href="https://www.linkedin.com/in/iamalexmartin/"
          aria-label="Alex Martin's LinkedIn Profile"
          title="Alex Martin's LinkedIn Profile"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faLinkedin} />
        </Link>
      </div>
    </div>
  );
}

function Navigate() {
  return (
    <div className={styles.navigate}>
      <h3>Navigate</h3>
      <ul>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/projects">Projects</Link></li>
        <li><Link href="/about">About</Link></li>
        <li><Link href="/contact">Contact</Link></li>
      </ul>
    </div>
  );
}

function Projects({ projectTypes }) {
  return (
    <div className={styles.projects}>
      <h3>Projects</h3>
      <ul>
        {projectTypes.map((type : any) => (
          <li key={type.name}>
            <Link href={`/projects?projectType=${type.name}`}>{camelCaseToSentence(type.name)}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Footer() {
  // Schema-level data (enum values) that only changes when the CMS model
  // changes — widen the visitor cache window rather than refetching often.
  const data = await cmsQuery(PROJECTS_TYPES_QUERY, {}, { revalidateSeconds: 3600 });

  return (
    <footer className={styles.wrapper}>
      <div className={styles.container}>
        <Social />
        <div className={styles.links}>
          <Navigate />
          <Projects projectTypes={data["__type"].enumValues} />
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} <span>Alexander Martin</span>.</p>
      </div>
    </footer>
  );
};