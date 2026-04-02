"use client";
import styles from "./NavBar.module.scss";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

export default function Navigation() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const dropdownRef = useRef(null);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Projects", path: "/projects" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" }
  ];

  // Initialize theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
  }, []);

  // Update theme when changed
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, pathname]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return <>
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.path}
          className={`${styles.nav_item} ${pathname === item.path ? styles.active : ""}`}
        >
          <span>{item.label}</span>
        </Link>
      ))}
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
    </nav>
    <nav className={styles.navSmall} ref={dropdownRef}>
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
      <button
        className={styles.navSmallToggle}
        onClick={toggleDropdown}
        aria-expanded={isDropdownOpen}
        aria-label="Toggle navigation menu"
      >
        <FontAwesomeIcon
          icon={isDropdownOpen ? faTimes : faBars}
          className={styles.navSmallIcon}
        />
      </button>
      {isDropdownOpen && (
        <div className={styles.dropdownMenu}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              className={`${styles.dropdownItem} ${pathname === item.path ? styles.active : ""}`}
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