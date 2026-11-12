"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";

type Props = Readonly<{
  label: string;
  items: ReadonlyArray<{ href: string; label: string }>;
}>;

/** Reference Headless UI primitive: states styled via data-* in globals.css. */
export default function Dropdown({ label, items }: Props) {
  return (
    <Menu>
      <MenuButton className="btn-secondary btn-sm">{label}</MenuButton>
      <MenuItems transition anchor="bottom end" className="menu-items">
        {items.map(item => (
          <MenuItem key={item.href}>
            <Link href={item.href} className="menu-item">
              {item.label}
            </Link>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
