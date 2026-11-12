/** Pausa's fortune wheel: eight slices, a pointer and a hub. Decorative; `data-spin` lets the case study turn the disc with the scroll. */
export default function Wheel({
  spin,
  className,
}: Readonly<{ spin: number; className?: string }>) {
  return (
    <div
      aria-hidden="true"
      className={className ? `wheel ${className}` : "wheel"}
    >
      <div className="wheel-disc" data-spin={spin} />
      <span className="wheel-hub" />
      <span className="wheel-pointer" />
    </div>
  );
}
