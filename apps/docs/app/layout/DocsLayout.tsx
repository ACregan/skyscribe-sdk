import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router";
import SvgIcon, { SvgImageList } from "~/components/SvgIcon";
import SideMenu from "./SideMenu";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";
import styles from "./DocsLayout.module.css";

// The skyscribe.app shell (CoreLayout + CommonLayout), minus everything
// tied to the app itself: no login, subscription, toasts or notifications.
// Header with the logo and a search bar where the app's Omnibar sits, the
// side menu, the content panel, and a footer.

const MENU_PREF_KEY = "sideMenuExpanded";

function readMenuPreference(): boolean | null {
  try {
    const value = localStorage.getItem(MENU_PREF_KEY);
    return value === null ? null : value === "true";
  } catch {
    return null;
  }
}

function saveMenuPreference(expanded: boolean): void {
  try {
    localStorage.setItem(MENU_PREF_KEY, String(expanded));
  } catch {
    // Storage blocked: the menu still works, it just isn't remembered.
  }
}

export default function DocsLayout() {
  // Prerendered expanded; the saved preference is applied after hydration
  // so the server HTML and the first client render match.
  const [menuExpanded, setMenuExpanded] = useState(true);

  useEffect(() => {
    const saved = readMenuPreference();
    if (saved !== null) setMenuExpanded(saved);
  }, []);

  function toggleMenu() {
    setMenuExpanded((expanded) => {
      saveMenuPreference(!expanded);
      return !expanded;
    });
  }

  return (
    <>
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>
      <div
        className={
          menuExpanded ? styles.coreContainer_expanded : styles.coreContainer
        }
      >
        <header className={styles.header}>
          <Link to="/" className={styles.logoLink} aria-label="SkyScribe SDK home">
            <SvgIcon
              name={SvgImageList.SkyScribeLogoAndText}
              className={styles.logo}
            />
            <span className={styles.logoBadge}>SDK</span>
          </Link>
          <div className={styles.centerContainer}>
            <SearchBar />
          </div>
          <div className={styles.childrenContainer}>
            <a
              href="https://skyscribe.app"
              className={styles.headerLink}
              target="_blank"
              rel="noreferrer noopener"
            >
              skyscribe.app
            </a>
            <ThemeToggle />
          </div>
        </header>

        <aside className={styles.aside}>
          <SideMenu menuExpanded={menuExpanded} />
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={menuExpanded ? "Collapse navigation" : "Expand navigation"}
            aria-expanded={menuExpanded}
            className={
              menuExpanded
                ? styles.menuToggleButton_expanded
                : styles.menuToggleButton
            }
          >
            <SvgIcon name={SvgImageList.ChevronLeft} />
          </button>
        </aside>

        <main id="main-content" className={styles.main}>
          <Outlet />
        </main>

        <footer className={styles.footer}>
          <span className={styles.footerNote}>
            SkyScribe SDK · MIT licensed
          </span>
          <nav className={styles.footerLinks} aria-label="Footer">
            <a href="https://www.npmjs.com/org/skyscribe-sdk">npm</a>
            <a href="https://github.com/ACregan/skyscribe-sdk">GitHub</a>
            <a href="https://skyscribe.blog">Blog</a>
            <a href="https://skyscribe.app/privacy">Privacy</a>
          </nav>
        </footer>
      </div>
    </>
  );
}
