/** Every page of the journey, in order. The bottom bar, the snapper and the text motion all read this. */
export const PAGES = [
  { id: "home", label: "Home", path: "/" },
  { id: "projects", label: "Projects", path: "/projects" },
  { id: "about", label: "About", path: "/about" },
  { id: "contact", label: "Contact", path: "/contact" },
] as const;

export const pad = (n: number) => String(n).padStart(2, "0");
