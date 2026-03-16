export default function AgentHighlightsSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1A0D40]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_80%_20%,rgba(212,168,67,0.06),transparent_45%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="mb-[3vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#D4A843] uppercase mb-[1.5vh]">
            Key Agents
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F5F0E8]">
            Agents That Power the Ecosystem
          </h2>
        </div>

        <div className="flex-1 flex gap-[2vw]">
          <div className="flex-1 flex flex-col gap-[2vh]">
            <div className="flex-1 bg-gradient-to-r from-[#D4A843]/10 to-transparent border border-[#D4A843]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#D4A843] mb-[1vh]">DR. FORMULA</h3>
              <p className="font-body text-[1.2vw] text-[#F5F0E8]/80 mb-[0.5vh]">Chief Medical Protocol Agent</p>
              <p className="font-body text-[1.2vw] text-[#B8A4E0]/55 leading-relaxed">Generates complete personalized healing protocols using the Steve Baker 2026 methodology and 127+ therapeutic products</p>
            </div>

            <div className="flex-1 bg-gradient-to-r from-[#6644BB]/10 to-transparent border border-[#6644BB]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#6644BB] mb-[1vh]">TRUE VISION</h3>
              <p className="font-body text-[1.2vw] text-[#F5F0E8]/80 mb-[0.5vh]">Blood Analysis Agent</p>
              <p className="font-body text-[1.2vw] text-[#B8A4E0]/55 leading-relaxed">AI-assisted blood panel interpretation with functional medicine ranges, pattern detection, and root-cause correlation</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-[2vh]">
            <div className="flex-1 bg-gradient-to-r from-[#8B6FCC]/10 to-transparent border border-[#8B6FCC]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#8B6FCC] mb-[1vh]">RESEARCH SCOUT</h3>
              <p className="font-body text-[1.2vw] text-[#F5F0E8]/80 mb-[0.5vh]">Literature Research Agent</p>
              <p className="font-body text-[1.2vw] text-[#B8A4E0]/55 leading-relaxed">Searches PubMed, clinical trials, and scientific databases to provide peer-reviewed evidence for protocol interventions</p>
            </div>

            <div className="flex-1 bg-gradient-to-r from-[#B8A4E0]/10 to-transparent border border-[#B8A4E0]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#B8A4E0] mb-[1vh]">AUTO-IMPLEMENTER</h3>
              <p className="font-body text-[1.2vw] text-[#F5F0E8]/80 mb-[0.5vh]">Self-Evolution Agent</p>
              <p className="font-body text-[1.2vw] text-[#B8A4E0]/55 leading-relaxed">Monitors system performance, identifies improvements, and implements enhancements through weekly auto-evolution cycles</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-[2vh]">
            <div className="flex-1 bg-gradient-to-r from-[#E8C977]/10 to-transparent border border-[#E8C977]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#E8C977] mb-[1vh]">GUARDIAN</h3>
              <p className="font-body text-[1.2vw] text-[#F5F0E8]/80 mb-[0.5vh]">Security Monitoring Agent</p>
              <p className="font-body text-[1.2vw] text-[#B8A4E0]/55 leading-relaxed">Continuous security monitoring, data protection enforcement, access control management, and threat detection</p>
            </div>

            <div className="flex-1 bg-gradient-to-r from-[#D4A843]/10 to-transparent border border-[#D4A843]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#D4A843] mb-[1vh]">ALLIO MONITOR</h3>
              <p className="font-body text-[1.2vw] text-[#F5F0E8]/80 mb-[0.5vh]">System Health Agent</p>
              <p className="font-body text-[1.2vw] text-[#B8A4E0]/55 leading-relaxed">Tracks health and performance of all 48 agents, detects failures, generates status reports for the Trustee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
