"use client";

type Props = Readonly<{ open: boolean; onToggle: () => void }>;

/** The mobile menu key: three hairlines that cross into an X while the menu is open. */
export default function MenuButton({ open, onToggle }: Props) {
  return (
    <button
      type="button"
      className="menu-button"
      aria-label="Menu"
      aria-expanded={open}
      aria-controls="menu"
      data-open={open ? "" : undefined}
      onClick={onToggle}
    >
      <i />
      <i />
      <i />
    </button>
  );
}
