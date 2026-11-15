import { Link, useLocation } from "react-router";
import SvgIcon, { type SvgImageListTypes } from "~/components/SvgIcon";
import { docsHref, docsSections, sectionForSlug } from "~/docs/nav";
import styles from "./SideMenu.module.css";

// skyscribe.app's SideMenu look (styles copied verbatim from
// skyscribe-app/app/components/SideMenu/SideMenu.module.css): one row per
// docs section, linking to that section's first page. The pages within a
// section are listed by the sidebar inside the content panel.

interface MenuItemProps {
  label: string;
  path: string;
  icon: SvgImageListTypes;
  active: boolean;
  menuExpanded: boolean;
  external?: boolean;
}

function MenuItem({
  label,
  path,
  icon,
  active,
  menuExpanded,
  external,
}: MenuItemProps) {
  const className = [
    styles.menuItemLink,
    menuExpanded ? styles.menuItemLink_expanded : "",
    active ? styles.menuItemLink_active : "",
  ].join(" ");
  const content = (
    <>
      <SvgIcon
        fill={active ? "var(--text-primary_highlight)" : "var(--text-primary)"}
        name={icon}
        className={styles.menuItemIcon}
      />
      <span className={styles.menuItemLabel}>{label}</span>
    </>
  );

  return (
    <li className={styles.menuItem}>
      {external ? (
        <a
          href={path}
          className={className}
          target="_blank"
          rel="noreferrer noopener"
          title={menuExpanded ? undefined : label}
        >
          {content}
        </a>
      ) : (
        <Link
          to={path}
          className={className}
          title={menuExpanded ? undefined : label}
          aria-current={active ? "page" : undefined}
        >
          {content}
        </Link>
      )}
    </li>
  );
}

export default function SideMenu({ menuExpanded }: { menuExpanded: boolean }) {
  const { pathname } = useLocation();
  const activeSection = sectionForSlug(pathname.replace(/^\/|\/$/g, ""));

  return (
    <>
      <h6 className={styles.menuLabel}>DOCS</h6>
      <ul className={styles.menuList}>
        {docsSections.map((section) => (
          <MenuItem
            key={section.title}
            label={section.menuLabel}
            path={docsHref(section.pages[0].slug)}
            icon={section.icon}
            active={section === activeSection}
            menuExpanded={menuExpanded}
          />
        ))}
      </ul>
      <h6 className={styles.menuLabel}>LINKS</h6>
      <ul className={styles.menuList}>
        <MenuItem
          label="SkyScribe"
          path="https://skyscribe.app"
          icon="SkyScribeLogo"
          active={false}
          menuExpanded={menuExpanded}
          external
        />
        <MenuItem
          label="Reader"
          path="https://reader.skyscribe.app"
          icon="ReaderLogo"
          active={false}
          menuExpanded={menuExpanded}
          external
        />
        <MenuItem
          label="Blog"
          path="https://skyscribe.blog"
          icon="BlogLogo"
          active={false}
          menuExpanded={menuExpanded}
          external
        />
        <MenuItem
          label="npm"
          path="https://www.npmjs.com/org/skyscribe-sdk"
          icon="OpenInNewTab"
          active={false}
          menuExpanded={menuExpanded}
          external
        />
      </ul>
    </>
  );
}
