import Loader from "@/components/sections/Loader";
import Navbar from "@/components/sections/Navbar";
import BottomBar from "@/components/sections/BottomBar";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Hero from "@/components/sections/Hero";
import PageMotion from "@/components/sections/PageMotion";
import PageSnap from "@/components/sections/PageSnap";
import Projects from "@/components/sections/Projects";
import Stage from "@/components/sections/Stage";
import CursorTip from "@/components/ui/CursorTip";

export default function JourneyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Loader />
      <main className="relative">
        {/* Outside the pages: they go inert when off-screen, and the page always needs its one h1. */}
        <h1 className="sr-only">Ettore Serra, designer and engineer</h1>
        <Stage />
        <Navbar />
        <Hero />
        <Projects />
        <About />
        <Contact />
        <div aria-hidden className="flare" />
        <BottomBar />
        <PageSnap />
        <PageMotion />
        {/* Above every canvas, so a held robot never covers its own label. */}
        <CursorTip label="Grab" variant="grab" />
        <CursorTip label="Drop" variant="drop" />
        {children}
      </main>
    </>
  );
}
