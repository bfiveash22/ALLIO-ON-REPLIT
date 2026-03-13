const base = import.meta.env.BASE_URL;

export default function SelfEvolving() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src={`${base}assets/allio_hero_banner_landscape.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        alt="ALLIO cosmic background"
      />
      <div className="absolute inset-0 bg-[#0F1D30]/85" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1D30]/50 via-transparent to-[#0F1D30]/30" />

      <div className="relative flex flex-col justify-center h-full px-[7vw] py-[7vh]">
        <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#00D4AA] uppercase mb-[2vh]">
          Self-Evolving Intelligence
        </p>

        <h2 className="font-display text-[4.2vw] leading-[1.05] font-bold text-white tracking-tight max-w-[60vw]">
          The Platform Gets Smarter Every Week
        </h2>

        <p className="font-body text-[1.8vw] text-[#C8D6E5] mt-[3vh] max-w-[50vw] leading-relaxed">
          No manual updates required. ALLIO autonomously enhances its capabilities through weekly evolution cycles.
        </p>

        <div className="mt-[5vh] flex gap-[2.5vw]">
          <div className="glass-card p-[2.5vw] flex-1">
            <p className="font-display text-[2.2vw] font-bold text-[#FFD700] mb-[1vh]">
              Weekly Cycles
            </p>
            <p className="font-body text-[1.4vw] text-[#C8D6E5] leading-snug">
              Automated enhancement sprints that improve protocols, refine diagnostics, and expand capabilities
            </p>
          </div>

          <div className="glass-card p-[2.5vw] flex-1">
            <p className="font-display text-[2.2vw] font-bold text-[#00D4AA] mb-[1vh]">
              Auto-Implementer
            </p>
            <p className="font-body text-[1.4vw] text-[#C8D6E5] leading-snug">
              Engineering agents that write, test, and deploy new features without human intervention
            </p>
          </div>

          <div className="glass-card p-[2.5vw] flex-1">
            <p className="font-display text-[2.2vw] font-bold text-[#FFD700] mb-[1vh]">
              Dynamic Routing
            </p>
            <p className="font-body text-[1.4vw] text-[#C8D6E5] leading-snug">
              Intelligent model selection that picks the best AI for each task — adapting as technology evolves
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
