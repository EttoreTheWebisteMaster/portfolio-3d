import HeroScene from "@/components/three/HeroScene";

/** Fixed 3D set behind every page: ground, name and the one canvas. */
export default function Stage() {
  return (
    <div aria-hidden className="scene stage">
      <div className="stage-bg" />
      <p className="hero-name" data-depth="1">
        <span className="hero-name-text" data-name data-text="Ettore Serra">
          Ettore Serra
        </span>
      </p>
      <HeroScene />
    </div>
  );
}
