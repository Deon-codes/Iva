import Nav from "./components/landing/Nav";
import Hero from "./components/landing/Hero";
import SchemeSourceMarquee from "./components/landing/SchemeSourceMarquee";
import AgenticProgression from "./components/landing/AgenticProgression";
import CapabilityStrip from "./components/landing/CapabilityStrip";
import AgentWorkflowShowcase from "./components/landing/AgentWorkflowShowcase";
import StatusFeedMoment from "./components/landing/StatusFeedMoment";
import TrustControlSection from "./components/landing/TrustControlSection";
import DocumentsSection from "./components/landing/DocumentsSection";
import PhoneAccessSection from "./components/landing/PhoneAccessSection";
import FinalCTA from "./components/landing/FinalCTA";
import Footer from "./components/landing/Footer";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <SchemeSourceMarquee />
      <AgenticProgression />
      <CapabilityStrip />
      <AgentWorkflowShowcase />
      <StatusFeedMoment />
      <TrustControlSection />
      <DocumentsSection />
      <PhoneAccessSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
