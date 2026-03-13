export default function AgentNetwork() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-[#0F1D30] via-[#162D4A] to-[#0F1D30]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,170,0.06),transparent_60%)]" />

      <div className="relative flex flex-col h-full px-[5vw] py-[5vh]">
        <div className="text-center mb-[3vh]">
          <p className="font-body text-[1.4vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1vh]">
            The Ecosystem
          </p>
          <h2 className="font-display text-[3.8vw] leading-[1] font-bold text-white tracking-tight">
            7 Divisions. One Mission.
          </h2>
        </div>

        <div className="flex-1 flex items-center">
          <div className="grid grid-cols-4 gap-x-[2vw] gap-y-[2.5vh] w-full">
            <div className="glass-card p-[1.8vw]">
              <p className="font-body text-[1.2vw] text-[#00D4AA] tracking-wider uppercase mb-[0.8vh]">Science</p>
              <p className="font-display text-[1.8vw] font-bold text-white mb-[0.8vh]">Research Division</p>
              <p className="font-body text-[1.3vw] text-[#C8D6E5] leading-snug">
                PubMed analysis, clinical evidence synthesis, protocol validation
              </p>
            </div>

            <div className="glass-card p-[1.8vw]">
              <p className="font-body text-[1.2vw] text-[#FFD700] tracking-wider uppercase mb-[0.8vh]">Support</p>
              <p className="font-display text-[1.8vw] font-bold text-white mb-[0.8vh]">Patient Services</p>
              <p className="font-body text-[1.3vw] text-[#C8D6E5] leading-snug">
                Member intake, protocol delivery, patient communication
              </p>
            </div>

            <div className="glass-card p-[1.8vw]">
              <p className="font-body text-[1.2vw] text-[#00D4AA] tracking-wider uppercase mb-[0.8vh]">Legal</p>
              <p className="font-display text-[1.8vw] font-bold text-white mb-[0.8vh]">Compliance Division</p>
              <p className="font-body text-[1.3vw] text-[#C8D6E5] leading-snug">
                PMA document generation, regulatory monitoring, member rights
              </p>
            </div>

            <div className="glass-card p-[1.8vw]">
              <p className="font-body text-[1.2vw] text-[#FFD700] tracking-wider uppercase mb-[0.8vh]">Engineering</p>
              <p className="font-display text-[1.8vw] font-bold text-white mb-[0.8vh]">Tech Division</p>
              <p className="font-body text-[1.3vw] text-[#C8D6E5] leading-snug">
                Platform development, auto-implementation, system optimization
              </p>
            </div>

            <div className="glass-card p-[1.8vw]">
              <p className="font-body text-[1.2vw] text-[#00D4AA] tracking-wider uppercase mb-[0.8vh]">Clinical</p>
              <p className="font-display text-[1.8vw] font-bold text-white mb-[0.8vh]">Protocol Engine</p>
              <p className="font-body text-[1.3vw] text-[#C8D6E5] leading-snug">
                5R methodology, personalized protocols, product matching
              </p>
            </div>

            <div className="glass-card p-[1.8vw]">
              <p className="font-body text-[1.2vw] text-[#FFD700] tracking-wider uppercase mb-[0.8vh]">Intelligence</p>
              <p className="font-display text-[1.8vw] font-bold text-white mb-[0.8vh]">Analytics Division</p>
              <p className="font-body text-[1.3vw] text-[#C8D6E5] leading-snug">
                Outcome tracking, trend analysis, network health monitoring
              </p>
            </div>

            <div className="glass-card p-[1.8vw] col-span-2">
              <p className="font-body text-[1.2vw] text-[#00D4AA] tracking-wider uppercase mb-[0.8vh]">Operations</p>
              <p className="font-display text-[1.8vw] font-bold text-white mb-[0.8vh]">Trustee &amp; Command</p>
              <p className="font-body text-[1.3vw] text-[#C8D6E5] leading-snug">
                Cross-division orchestration, task delegation, autonomous governance, and self-healing infrastructure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
