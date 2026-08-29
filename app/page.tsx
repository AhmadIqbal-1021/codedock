import { Navbar } from "@/components/layout/navbar/Navbar";
import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";

 import { FeaturedTools } from "@/components/home/FeaturedTools";
// import { LatestArticles } from "@/components/home/LatestArticles";
// import { WhyCodeDock } from "@/components/home/WhyCodeDock";
import { Footer } from "@/components/layout/Footer";


export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <FeaturedTools />
        <Categories />
        
        {/* <LatestArticles /> */}
        {/* <WhyCodeDock /> */}
      </main>

      <Footer />
    </>
  );
}