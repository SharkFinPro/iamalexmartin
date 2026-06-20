"use client";
import styles from "./NavBar.module.scss";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

export default function Navigation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const docTheme = document.documentElement.dataset.theme;
    if (docTheme === 'light' || docTheme === 'dark') return docTheme;
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const dropdownRef = useRef<HTMLElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const isInitialized = useRef(false);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Projects", path: "/projects" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" }
  ];

  // Update theme when changed - skip the initial mount since the inline
  // script and lazy initializer have already set the correct value.
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('theme', theme);
      }
    } catch {
      // Ignore storage errors to avoid breaking navigation
    }
  }, [theme]);

  // Close dropdown on outside click or Escape. Escape also returns focus to the
  // toggle so keyboard users aren't stranded.
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        toggleButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen, pathname]);

  // Move focus to the first menu item when the dropdown opens, so keyboard users
  // land inside it rather than having to tab past the toggle.
  useEffect(() => {
    if (!isDropdownOpen) return;
    const firstItem = dropdownRef.current?.querySelector<HTMLElement>(`.${styles.dropdownItem}`);
    firstItem?.focus();
  }, [isDropdownOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Same control in both the desktop and small-screen navs.
  const themeToggle = mounted && (
    <button
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <FontAwesomeIcon
        icon={theme === 'light' ? faMoon : faSun}
        className={styles.themeToggleIcon}
      />
    </button>
  );

  return <>
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.path}
          className={`${styles.nav_item} ${pathname === item.path ? styles.active : ""}`}
          aria-current={pathname === item.path ? "page" : undefined}
        >
          <span>{item.label}</span>
        </Link>
      ))}
      {themeToggle}
    </nav>
    <nav className={styles.navSmall} ref={dropdownRef}>
      {themeToggle}
      <button
        ref={toggleButtonRef}
        className={styles.navSmallToggle}
        onClick={toggleDropdown}
        aria-expanded={isDropdownOpen}
        aria-controls={menuId}
        aria-label="Toggle navigation menu"
      >
        <FontAwesomeIcon
          icon={isDropdownOpen ? faTimes : faBars}
          className={styles.navSmallIcon}
        />
      </button>
      {isDropdownOpen && (
        <div className={styles.dropdownMenu} id={menuId}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              className={`${styles.dropdownItem} ${pathname === item.path ? styles.active : ""}`}
              aria-current={pathname === item.path ? "page" : undefined}
              onClick={toggleDropdown}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  </>
}