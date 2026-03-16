export default function AgentHighlightsSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0F1D30]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_80%_20%,rgba(212,168,67,0.06),transparent_45%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="mb-[3vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1.5vh]">
            Key Agents
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8]">
            Agents That Power the Ecosystem
          </h2>
        </div>

        <div className="flex-1 flex gap-[2vw]">
          <div className="flex-1 flex flex-col gap-[2vh]">
            <div className="flex-1 bg-gradient-to-r from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#FFD700] mb-[1vh]">DR. FORMULA</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">Chief Medical Protocol Agent</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">Generates complete personalized healing protocols using the FF PMA 2026 methodology and 127+ therapeutic products</p>
            </div>

            <div className="flex-1 bg-gradient-to-r from-[#2A4F7A]/10 to-transparent border border-[#2A4F7A]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#2A4F7A] mb-[1vh]">TRUE VISION</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">Blood Analysis Agent</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">AI-assisted blood panel interpretation with functional medicine ranges, pattern detection, and root-cause correlation</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-[2vh]">
            <div className="flex-1 bg-gradient-to-r from-[#3B6FA0]/10 to-transparent border border-[#3B6FA0]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#3B6FA0] mb-[1vh]">RESEARCH SCOUT</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">Literature Research Agent</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">Searches PubMed, clinical trials, and scientific databases to provide peer-reviewed evidence for protocol interventions</p>
            </div>

            <div className="flex-1 bg-gradient-to-r from-[#C8D6E5]/10 to-transparent border border-[#C8D6E5]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#C8D6E5] mb-[1vh]">AUTO-IMPLEMENTER</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">Self-Evolution Agent</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">Monitors system performance, identifies improvements, and implements enhancements through weekly auto-evolution cycles</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-[2vh]">
            <div className="flex-1 bg-gradient-to-r from-[#FFE44D]/10 to-transparent border border-[#FFE44D]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#FFE44D] mb-[1vh]">GUARDIAN</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">Security Monitoring Agent</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">Continuous security monitoring, data protection enforcement, access control management, and threat detection</p>
            </div>

            <div className="flex-1 bg-gradient-to-r from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#FFD700] mb-[1vh]">ALLIO MONITOR</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">System Health Agent</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">Tracks health and performance of all 48 agents, detects failures, generates status reports for the Trustee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
