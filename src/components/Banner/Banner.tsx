import styles from "./banner.module.scss";

export default function Banner({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}