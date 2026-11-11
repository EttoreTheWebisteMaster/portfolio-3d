import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CaseStudy from "@/components/sections/CaseStudy";
import Navbar from "@/components/sections/Navbar";
import { findProject, PROJECTS, slugOf } from "@/lib/projects";

type Props = Readonly<{ params: Promise<{ slug: string }> }>;

export const generateStaticParams = () =>
  PROJECTS.map(project => ({ slug: slugOf(project.title) }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = findProject((await params).slug);
  return project
    ? { title: `${project.title} · Case study`, description: project.lead }
    : {};
}

export default async function ProjectPage({ params }: Props) {
  const slug = (await params).slug;
  const project = findProject(slug);
  if (!project) notFound();
  const at = PROJECTS.indexOf(project);
  return (
    <main>
      <Navbar />
      <CaseStudy
        project={project}
        index={at}
        next={PROJECTS[(at + 1) % PROJECTS.length]}
      />
      <div aria-hidden className="flare" />
    </main>
  );
}
