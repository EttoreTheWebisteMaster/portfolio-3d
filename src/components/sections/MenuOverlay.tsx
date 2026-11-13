"use client";

import Link from "next/link";

type Props = Readonly<{
  open: boolean;
  /** The theme the menu opened in: it keeps it until it is gone, even if the page behind turns from dark to cream (or back) under it. */
  tone: "screen" | "paper";
  items: ReadonlyArray<{ href: string; label: string; count?: string }>;
}>;

/** The phone's menu: a full screen under the top and bottom bars. Every item is a plain journey link, so the page snapper moves the page. */
export default function MenuOverlay({ open, tone, items }: Props) {
  return (
    <div
      id="menu"
      className="menu-overlay md:hidden"
      data-open={open}
      data-tone={tone}
      inert={!open}
    >
      <nav aria-label="Menu">
        <ol>
          {items.map((item, i) => (
            <li key={item.href}>
              <Link href={item.href} data-nav={item.label.toLowerCase()}>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <b>{item.label}</b>
                {item.count && <sup aria-hidden="true">{item.count}</sup>}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
      <p className="menu-meta">Designer &amp; engineer · Turin, or remote</p>
    </div>
  );
}
