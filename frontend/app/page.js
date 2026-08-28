import Nav from "./components/landing/Nav";
import Hero from "./components/landing/Hero";
import SchemeSourceMarquee from "./components/landing/SchemeSourceMarquee";
import ProblemSection from "./components/landing/ProblemSection";
import AgenticProgression from "./components/landing/AgenticProgression";
import CapabilityStrip from "./components/landing/CapabilityStrip";
import AgentWorkflowShowcase from "./components/landing/AgentWorkflowShowcase";
import TrustControlSection from "./components/landing/TrustControlSection";
import ApplicationSection from "./components/landing/ApplicationSection";
import Footer from "./components/landing/Footer";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <SchemeSourceMarquee />
      <ProblemSection />
      <AgenticProgression />
      <CapabilityStrip />
      <AgentWorkflowShowcase />
      <TrustControlSection />
      <ApplicationSection />
      <Footer />
    </main>
  );
}
