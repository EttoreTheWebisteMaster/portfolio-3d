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

export default function JourneyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Loader />
      <main className="relative">
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
        {children}
      </main>
    </>
  );
}
