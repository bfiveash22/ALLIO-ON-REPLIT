export default function EcosystemBundleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_0%,rgba(0,212,170,0.15),transparent_50%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="mb-[4vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1.5vh]">
            Root Cause Ecosystem
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8]">
            The Complete Healing Bundle
          </h2>
        </div>

        <div className="flex-1 flex gap-[2vw]">
          <div className="flex-1 bg-gradient-to-b from-[#1E3A5F]/50 to-[#1E3A5F]/20 border border-[#2A4F7A]/25 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-[#FFD700]/15 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw] text-[#FFD700]">💉</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Injectable Peptides</h3>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/65 leading-relaxed">Precision peptide therapy for tissue repair, immune modulation, and cellular regeneration.</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#1E3A5F]/50 to-[#1E3A5F]/20 border border-[#2A4F7A]/25 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-[#FFD700]/15 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw] text-[#FFD700]">🧬</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Bioregulators</h3>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/65 leading-relaxed">Organ-specific bioregulators targeting thyroid, liver, brain, and endocrine system restoration.</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#1E3A5F]/50 to-[#1E3A5F]/20 border border-[#2A4F7A]/25 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-[#FFD700]/15 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw] text-[#FFD700]">🌿</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Supplements</h3>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/65 leading-relaxed">Clinical-grade nutraceuticals, adaptogens, and targeted nutritional support protocols.</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#1E3A5F]/50 to-[#1E3A5F]/20 border border-[#2A4F7A]/25 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-[#FFD700]/15 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw] text-[#FFD700]">🧪</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">IV & Detox</h3>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/65 leading-relaxed">IV nutrient therapy, chelation protocols, and structured detoxification programs.</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#1E3A5F]/50 to-[#1E3A5F]/20 border border-[#2A4F7A]/25 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-[#FFD700]/15 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw] text-[#FFD700]">🔬</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Diagnostics</h3>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/65 leading-relaxed">True Vision blood analysis, ECS profiling, and AI-assisted diagnostic interpretation.</p>
          </div>
        </div>

        <div className="mt-[3vh] flex items-center gap-[2vw]">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#FFD700]/30 to-transparent" />
          <p className="font-body text-[1.3vw] text-[#C8D6E5]/50">All products sourced through the FFPMA catalog</p>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-[#FFD700]/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
