import styles from "./landing.module.scss";
import Link from "next/link";
import EditableText from "@/components/EditableText";

export default function Landing({ className, description, isAdmin = false }) {
  return (
    <div className={className}>
      <div className={styles.container}>
        <div className={styles.panel}>
          <h1 className={styles.title}>
            <EditableText model="Description" id={description.id} field="header" value={description.header} editable={isAdmin} floatEdit>
              {description.header}
            </EditableText>
          </h1>
          <p className={styles.description}>
            <EditableText model="Description" id={description.id} field="description" value={description.description} editable={isAdmin} multiline>
              {description.description}
            </EditableText>
          </p>

          <div className={styles.buttons}>
            <Link href={"/projects"} className={`${styles.homepageButton} ${styles.viewProjects}`}>View My Work</Link>
            <Link href={"/contact"} className={`${styles.homepageButton} ${styles.contactMe}`}>Contact Me</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
