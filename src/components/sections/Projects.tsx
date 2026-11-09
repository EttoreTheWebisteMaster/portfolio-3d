import ProjectsPanel from "@/components/sections/ProjectsPanel";

/** Projects: the 3D cinema behind does the picture; this layer is the programme beside the screen. */
export default function Projects() {
  return (
    <section id="projects" data-page className="page">
      <h2 className="sr-only">Projects</h2>
      <ProjectsPanel />
    </section>
  );
}
