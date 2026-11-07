import Link from "next/link";

type Props = Readonly<{
  label: string;
  index: number;
  total: number;
  nextHref: string;
  nextLabel: string;
}>;

const pad = (n: number) => String(n).padStart(2, "0");

export default function BottomBar({
  label,
  index,
  total,
  nextHref,
  nextLabel,
}: Props) {
  return (
    <footer className="absolute inset-x-0 bottom-0 z-10 bar bar-solid">
      <p className="bar-label whitespace-nowrap">
        {pad(index)} · {label}
      </p>
      <Link href={nextHref} className="bar-cue">
        {nextLabel} ↓
      </Link>
      <p className="bar-progress whitespace-nowrap">
        <span>
          {pad(index)} / {pad(total)}
        </span>
        <span className="hidden md:block">
          <span className="bar-ticks" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <i key={i} aria-current={i + 1 === index ? "true" : undefined} />
            ))}
          </span>
        </span>
      </p>
    </footer>
  );
}
