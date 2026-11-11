import { Button as HeadlessButton, type ButtonProps } from "@headlessui/react";
import Link from "next/link";

import { cn } from "@/lib/cn";

const variants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  key: "btn-key",
  timer: "btn-timer",
} as const;

type Props = Readonly<
  Omit<ButtonProps, "children"> & {
    children: string;
    variant?: keyof typeof variants;
    size?: "md" | "sm" | "xl";
    /** Renders a link instead of a button. */
    href?: string;
    /** Opens the link in a new tab. */
    external?: boolean;
    /** Adds the exit-and-enter arrow. */
    arrow?: boolean;
  }
>;

/** Two copies of one arrow: on hover the first leaves right as the second enters from the left. */
export function ButtonArrow() {
  return (
    <span className="btn-arrow" aria-hidden>
      {[0, 1].map(i => (
        <svg key={i} viewBox="0 0 14 14" fill="none">
          <path
            d="M1 7h11M8 2.5 12.5 7 8 11.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      ))}
    </span>
  );
}

/** Two stacked copies of the label: on hover the first rolls out upward as the second rolls in. */
export function ButtonLabel({ children }: Readonly<{ children: string }>) {
  return (
    <span className="btn-label">
      <span>{children}</span>
      <span aria-hidden>{children}</span>
    </span>
  );
}

/** Reference primitive: variants map to full class names defined in globals.css. */
export default function Button({
  variant = "primary",
  size = "md",
  href,
  external,
  arrow,
  className,
  children,
  ...props
}: Props) {
  const cls = cn(
    variants[variant],
    size === "sm" && "btn-sm",
    size === "xl" && "btn-xl",
    className
  );
  const inner = (
    <>
      <ButtonLabel>{children}</ButtonLabel>
      {arrow && <ButtonArrow />}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {inner}
      </Link>
    );
  }
  return (
    <HeadlessButton className={cls} {...props}>
      {inner}
    </HeadlessButton>
  );
}
