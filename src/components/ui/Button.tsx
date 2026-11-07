import { Button as HeadlessButton, type ButtonProps } from "@headlessui/react";

import { cn } from "@/lib/cn";

const variants = { primary: "btn-primary", ghost: "btn-ghost" } as const;

type Props = Readonly<
  ButtonProps & { variant?: keyof typeof variants; size?: "md" | "sm" }
>;

/** Reference primitive: variants map to full class names defined in globals.css. */
export default function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Props) {
  return (
    <HeadlessButton
      className={cn(variants[variant], size === "sm" && "btn-sm", className)}
      {...props}
    />
  );
}
