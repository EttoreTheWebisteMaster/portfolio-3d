"use client";

import Link from "next/link";

import Dropdown from "@/components/ui/Dropdown";
import SoundToggle from "@/components/ui/SoundToggle";
import Timecode from "@/components/ui/Timecode";

const links = [
  { href: "/projects", label: "Projects", count: "09" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <header className="bar-veil fixed inset-x-0 top-0 z-10 bar">
      <Link href="/" className="logo" aria-label="Ettore Serra, home">
        <span>Ettore</span>
        <span>Serra</span>
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
              {link.count && <sup>{link.count}</sup>}
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
          <Dropdown label="Menu" items={links} />
        </div>
      </div>
    </header>
  );
}
