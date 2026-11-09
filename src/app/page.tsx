import Navbar from "@/components/sections/Navbar";
import BottomBar from "@/components/sections/BottomBar";
import Hero from "@/components/sections/Hero";
import PageMotion from "@/components/sections/PageMotion";
import PageSnap from "@/components/sections/PageSnap";
import Projects from "@/components/sections/Projects";
import Stage from "@/components/sections/Stage";

export default function Home() {
  return (
    <main className="relative">
      <Stage />
      <Navbar />
      <Hero />
      <Projects />
      <BottomBar />
      <PageSnap />
      <PageMotion />
    </main>
  );
}
