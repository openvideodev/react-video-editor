import Hero from "@/components/home/hero";
import Features from "@/components/home/features";
import Footer from "@/components/home/footer";

export default function HomePage() {
  return (
    <main className="flex h-full flex-col justify-center text-center w-full max-w-5xl mx-auto border-l border-r">
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
