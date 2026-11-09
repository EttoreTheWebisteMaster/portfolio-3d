/** Every page of the journey, in order. The bottom bar, the snapper and the text motion all read this. */
export const PAGES = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const;

export const pad = (n: number) => String(n).padStart(2, "0");
