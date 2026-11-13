import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import CaseShell from "@/components/sections/CaseShell";
import CaseStudy from "@/components/sections/CaseStudy";
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

/** The case study opens over Projects: the journey layout stays mounted behind it. */
export default function ProjectPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <Case params={params} />
    </Suspense>
  );
}

async function Case({ params }: Props) {
  const slug = (await params).slug;
  const project = findProject(slug);
  if (!project) notFound();
  const at = PROJECTS.indexOf(project);
  return (
    <CaseShell>
      <CaseStudy
        project={project}
        index={at}
        next={PROJECTS[(at + 1) % PROJECTS.length]}
      />
    </CaseShell>
  );
}
