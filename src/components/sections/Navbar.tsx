"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import MenuOverlay from "@/components/sections/MenuOverlay";
import MenuButton from "@/components/ui/MenuButton";
import { journey } from "@/lib/journey";
import { PAGES } from "@/lib/pages";
import SoundToggle from "@/components/ui/SoundToggle";
import Timecode from "@/components/ui/Timecode";

const links = [
  { href: "/projects", label: "Projects", count: "09" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** A skipped page is a cut under the veil, about this long. */
const CUT_SECONDS = 1.3;

/** Skipping pages, the menu leaves in step with the cut: it holds, then dissolves slowly so the new page is what is left when the cut ends. */
function setLeaving(link: HTMLAnchorElement) {
  const menu = document.getElementById("menu");
  const to = PAGES.findIndex(page => page.path === new URL(link.href).pathname);
  if (!menu || to < 0) return;
  const from = Math.round(journey.current);
  // A neighbouring page shows its whole transition, the menu just fades; only a skipped page is hidden under the menu.
  if (Math.abs(to - from) <= 1) return;
  const move = CUT_SECONDS;
  // The row ends just above the line at the foot of the menu.
  // Whatever link was pressed (the logo, the bottom bar...), the row of the page it leads to is the one that stays.
  const row = menu
    .querySelector(`a[data-nav="${PAGES[to].label.toLowerCase()}"]`)
    ?.closest("li")
    ?.getBoundingClientRect();
  const foot = menu.querySelector(".menu-meta")?.getBoundingClientRect();
  if (row && foot)
    menu.style.setProperty(
      "--menu-drop",
      `${Math.max(0, foot.top - row.bottom - 16)}px`
    );
  menu.style.setProperty("--menu-hold", `${(move * 0.4).toFixed(2)}s`);
  menu.style.setProperty("--menu-out", `${(move * 0.6).toFixed(2)}s`);
}

const menuLinks = [{ href: "/", label: "Home" }, ...links];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<"screen" | "paper">("screen");
  const key = useRef<HTMLDivElement>(null);

  // The menu is for the phone layout: Esc closes it and hands the focus back to its key, and it closes if the window grows past it.
  useEffect(() => {
    if (!open) return;
    // The logo shows the whole name while the menu is open.
    document.documentElement.dataset.menu = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      key.current?.querySelector("button")?.focus();
    };
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => wide.matches && setOpen(false);
    document
      .querySelector<HTMLElement>("#menu a")
      ?.focus({ preventScroll: true });
    // Any link takes the visitor to a page (the logo, the bottom bar, the menu's own): the menu steps out of the way.
    const onLink = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a") : null;
      // New tab, new window, download or another site: the page here stays as it is.
      if (
        !link ||
        link.target ||
        link.hasAttribute("download") ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        new URL(link.href).origin !== window.location.origin
      )
        return;
      setLeaving(link);
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onLink);
    wide.addEventListener("change", onWide);
    return () => {
      // Closed any way at all, the focus goes back to the key, not to a row that has just become unreachable.
      const menu = document.getElementById("menu");
      if (menu?.contains(document.activeElement))
        document
          .querySelector<HTMLElement>('header button[aria-label="Menu"]')
          ?.focus({ preventScroll: true });
      delete document.documentElement.dataset.menu;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onLink);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <>
      <MenuOverlay open={open} tone={tone} items={menuLinks} />
      <header className="bar-veil fixed inset-x-0 top-0 z-10 bar">
        <Link href="/" className="logo" aria-label="Ettore Serra, home">
          <span>
            <b>E</b>
            <i aria-hidden="true">
              <em>
                <span>t</span>
                <span>t</span>
                <span>o</span>
                <span>r</span>
                <span>e</span>
              </em>
            </i>
          </span>
          <span>
            <b>S</b>
            <i aria-hidden="true">
              <em>
                <span>e</span>
                <span>r</span>
                <span>r</span>
                <span>a</span>
              </em>
            </i>
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <div className="nav-links">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                data-nav={link.label.toLowerCase()}
              >
                {link.label}
                {link.count && <sup aria-hidden="true">{link.count}</sup>}
              </Link>
            ))}
          </div>
        </nav>
        <div className="col-start-3 bar-meta">
          <div className="hidden lg:contents">
            <Timecode />
            <span className="bar-divider" />
          </div>
          <SoundToggle />
          <div className="contents md:hidden">
            <span className="bar-divider" />
            <div ref={key} className="contents">
              <MenuButton
                open={open}
                onToggle={() => {
                  // A fresh open or close runs at the menu's own pace.
                  const menu = document.getElementById("menu");
                  menu?.style.removeProperty("--menu-hold");
                  menu?.style.removeProperty("--menu-out");
                  menu?.style.removeProperty("--menu-drop");
                  // The menu keeps the theme it opened in until it is gone, whatever the page behind turns into.
                  setTone(
                    document.documentElement.hasAttribute("data-paper")
                      ? "paper"
                      : "screen"
                  );
                  setOpen(o => !o);
                }}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
