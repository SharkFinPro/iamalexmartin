import navBarStyles from "./NavBar.module.css";

export default function NavBar() {
  return (
    <nav className={navBarStyles.wrapper}>
      <div className={navBarStyles.nameContainer}>
        <p>Alex Martin</p>
      </div>
      <div className={navBarStyles.pagesContainer}>
        <p>Test</p>
      </div>
    </nav>
  );
}