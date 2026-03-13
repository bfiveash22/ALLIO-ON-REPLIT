export default function Diagnostics() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,215,0,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_70%,rgba(0,212,170,0.06),transparent_45%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[6vh]">
        <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1vh]">
          Advanced Diagnostics
        </p>
        <h2 className="font-display text-[3.8vw] leading-[1] font-bold text-white tracking-tight">
          True Vision Blood Analysis &amp; ECS Profiling
        </h2>

        <div className="flex-1 flex items-center mt-[3vh]">
          <div className="grid grid-cols-2 gap-[3vw] w-full">
            <div className="glass-card glow-cyan p-[3vw]">
              <div className="w-[4vw] h-[4vw] rounded-[0.8vw] bg-[#00D4AA]/15 flex items-center justify-center mb-[2vh]">
                <p className="font-display text-[2vw] text-[#00D4AA]">TV</p>
              </div>
              <p className="font-display text-[2.4vw] font-bold text-white mb-[1.5vh]">
                True Vision Analysis
              </p>
              <p className="font-body text-[1.5vw] text-[#C8D6E5] leading-relaxed">
                AI-powered blood work interpretation that goes beyond reference ranges — identifying functional patterns, deficiency cascades, and early markers of disease
              </p>
            </div>

            <div className="glass-card glow-gold p-[3vw]">
              <div className="w-[4vw] h-[4vw] rounded-[0.8vw] bg-[#FFD700]/15 flex items-center justify-center mb-[2vh]">
                <p className="font-display text-[2vw] text-[#FFD700]">ECS</p>
              </div>
              <p className="font-display text-[2.4vw] font-bold text-white mb-[1.5vh]">
                ECS Profiling
              </p>
              <p className="font-body text-[1.5vw] text-[#C8D6E5] leading-relaxed">
                Precision cannabinoid prescribing through endocannabinoid system mapping — matching specific compounds to receptor profiles for targeted therapeutic outcomes
              </p>
            </div>
          </div>
        </div>

        <div className="mt-[2vh]">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#00D4AA]/30 to-transparent" />
          <p className="font-body text-[1.4vw] text-[#8395A7] text-center mt-[1.5vh]">
            Real-time research integration — every recommendation backed by current literature
          </p>
        </div>
      </div>
    </div>
  );
}
