import type { MetadataRoute } from "next";
import { PROJECTS, slugOf } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/projects",
    "/about",
    "/contact",
    ...PROJECTS.map(p => `/projects/${slugOf(p.title)}`),
  ];
  return paths.map(path => ({ url: `${SITE_URL}${path}` }));
}
