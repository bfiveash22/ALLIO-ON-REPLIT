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
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">Generates complete personalized 90-day healing protocols using the FF PMA 2026 methodology — root cause analysis, 5R phases, injectable peptides, supplement stacks, and daily schedules</p>
            </div>

            <div className="flex-1 bg-gradient-to-r from-[#2A4F7A]/10 to-transparent border border-[#2A4F7A]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#3B9FDD] mb-[1vh]">SENTINEL</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">Executive Agent of Operations</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">Coordinates all 48 agents, monitors task health, routes cross-division requests, and orchestrates the SENTINEL Contract Review with the Legal Division</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-[2vh]">
            <div className="flex-1 bg-gradient-to-r from-[#3B6FA0]/10 to-transparent border border-[#3B6FA0]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#3B6FA0] mb-[1vh]">PROMETHEUS</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">Chief Science Officer</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">Leads the Science Division research strategy, integrating 13 specialist agents across genetics, peptides, frequency medicine, detox, and quantum biology</p>
            </div>

            <div className="flex-1 bg-gradient-to-r from-[#C8D6E5]/10 to-transparent border border-[#C8D6E5]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#C8D6E5] mb-[1vh]">JURIS & LEGAL TEAM</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">5-Agent Legal Division</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">JURIS, GAVEL, LEXICON, AEGIS, and SCRIBE collectively protect PMA sovereignty, review contracts, and manage member agreements via SignNow automation</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-[2vh]">
            <div className="flex-1 bg-gradient-to-r from-[#FFE44D]/10 to-transparent border border-[#FFE44D]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#FFE44D] mb-[1vh]">ATHENA</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">Executive Intelligence Agent</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">Primary bridge between the Trustee and the agent network — handles communications, escalations, and strategic routing of priority requests</p>
            </div>

            <div className="flex-1 bg-gradient-to-r from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 rounded-[1vw] p-[2vw]">
              <h3 className="font-body text-[1.6vw] font-bold text-[#FFD700] mb-[1vh]">PARACELSUS</h3>
              <p className="font-body text-[1.2vw] text-[#F0F4F8]/80 mb-[0.5vh]">Peptide & Biologics Expert</p>
              <p className="font-body text-[1.2vw] text-[#C8D6E5]/55 leading-relaxed">Powers the Peptide Console with deep pharmacological knowledge — stacking protocols, dosing guidance, mechanism education, and bioregulator expertise</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
