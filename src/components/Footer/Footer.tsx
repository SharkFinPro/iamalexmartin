import styles from "./Footer.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";

const PROJECTS_TYPES_QUERY = `
  query ProjectTypes {
    __type(name: "ProjectTypes") {
      enumValues {
        name
      }
    }
  }
`;

function camelCaseToSentence(str : string) {
  return str
    // Insert space before uppercase letters (but not at the start)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Insert space before numbers that follow letters
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    // Insert space before letters that follow numbers
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    // Capitalize the first letter
    .replace(/^./, match => match.toUpperCase());
}

function Social() {
  return (
    <div className={styles.social}>
      <p>Alexander Martin</p>
      <div className={styles.icons}>
        <Link
          href="https://github.com/SharkFinPro"
          aria-label="Alex Martin's GitHub Profile"
          title="Alex Martin's GitHub Profile"
        >
          <FontAwesomeIcon icon={faGithub} />
        </Link>
        <Link
          href="https://www.linkedin.com/in/iamalexmartin/"
          aria-label="Alex Martin's LinkedIn Profile"
          title="Alex Martin's LinkedIn Profile"
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
  const request = await fetch(process.env.CMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: PROJECTS_TYPES_QUERY
    })
  });
  const response = await request.json();

  return (
    <footer className={styles.wrapper}>
      <div className={styles.container}>
        <Social />
        <Navigate />
        <Projects projectTypes={response.data["__type"].enumValues} />
      </div>
      <div className={styles.bottom}>
        <p>&copy; 2025 <span>Alexander Martin</span>.</p>
      </div>
    </footer>
  );
};