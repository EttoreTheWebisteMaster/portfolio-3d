import Navbar from "@/components/sections/Navbar";
import BottomBar from "@/components/sections/BottomBar";
import Hero from "@/components/sections/Hero";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <BottomBar
        label="Home"
        index={1}
        total={4}
        nextHref="/projects"
        nextLabel="Projects"
      />
    </main>
  );
}
