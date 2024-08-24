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
          <Link href={""}><p>Test</p></Link>
          <Link href={""}><p>Test</p></Link>
          <Link href={""}><p>Test</p></Link>
        </div>
      </div>
    </nav>
  );
}