import navBarStyles from "./NavBar.module.scss";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className={navBarStyles.wrapper}>
      <div className={navBarStyles.container}>
        <div className={navBarStyles.nameContainer}>
          <p>Alex Martin</p>
        </div>
        <div className={navBarStyles.pagesContainer}>
          <Link href={""}><p>Home</p></Link>
          <Link href={""}><p>About</p></Link>
          <Link href={""}><p>Projects</p></Link>
        </div>
      </div>
    </nav>
  );
}