import clsx, { type ClassValue } from "clsx";

/** Join conditional class names. Visual classes come from globals.css. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
