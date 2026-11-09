import HeroScene from "@/components/three/HeroScene";

/** Fixed 3D set behind every page: ground, name and the one canvas. */
export default function Stage() {
  return (
    <div aria-hidden className="scene stage">
      <div className="stage-bg" />
      <p className="hero-name">Ettore Serra</p>
      <HeroScene />
    </div>
  );
}
