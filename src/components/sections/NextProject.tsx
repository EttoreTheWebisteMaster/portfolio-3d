import Button from "@/components/ui/Button";

/** The end of a case study: the next project is offered, never opened on its own. */
export default function NextProject({
  href,
  title,
}: Readonly<{ href: string; title: string }>) {
  return (
    <div className="case-next">
      <p className="eyebrow">Next project</p>
      <h2 className="case-next-title">{title}</h2>
      <Button href={href} arrow>
        View project
      </Button>
    </div>
  );
}
