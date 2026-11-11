import Loader from "@/components/sections/Loader";
import Navbar from "@/components/sections/Navbar";
import BottomBar from "@/components/sections/BottomBar";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import ContactStage from "@/components/sections/ContactStage";
import Hero from "@/components/sections/Hero";
import PageMotion from "@/components/sections/PageMotion";
import PageSnap from "@/components/sections/PageSnap";
import Projects from "@/components/sections/Projects";
import Stage from "@/components/sections/Stage";

export default function Home() {
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
        <ContactStage />
        <div aria-hidden className="flare" />
        <BottomBar />
        <PageSnap />
        <PageMotion />
      </main>
    </>
  );
}
