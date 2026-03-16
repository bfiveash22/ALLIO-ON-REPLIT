export default function EcosystemBundleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-[#1A0D40] via-[#251560] to-[#1A0D40]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_0%,rgba(102,68,187,0.15),transparent_50%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="mb-[4vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#D4A843] uppercase mb-[1.5vh]">
            Root Cause Ecosystem
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F5F0E8]">
            The Complete Healing Bundle
          </h2>
        </div>

        <div className="flex-1 flex gap-[2vw]">
          <div className="flex-1 bg-gradient-to-b from-[#331A80]/50 to-[#331A80]/20 border border-[#6644BB]/25 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-[#D4A843]/15 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw] text-[#D4A843]">💉</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F5F0E8] mb-[1vh]">Injectable Peptides</h3>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/65 leading-relaxed">Precision peptide therapy for tissue repair, immune modulation, and cellular regeneration.</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#331A80]/50 to-[#331A80]/20 border border-[#6644BB]/25 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-[#D4A843]/15 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw] text-[#D4A843]">🧬</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F5F0E8] mb-[1vh]">Bioregulators</h3>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/65 leading-relaxed">Organ-specific bioregulators targeting thyroid, liver, brain, and endocrine system restoration.</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#331A80]/50 to-[#331A80]/20 border border-[#6644BB]/25 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-[#D4A843]/15 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw] text-[#D4A843]">🌿</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F5F0E8] mb-[1vh]">Supplements</h3>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/65 leading-relaxed">Clinical-grade nutraceuticals, adaptogens, and targeted nutritional support protocols.</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#331A80]/50 to-[#331A80]/20 border border-[#6644BB]/25 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-[#D4A843]/15 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw] text-[#D4A843]">🧪</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F5F0E8] mb-[1vh]">IV & Detox</h3>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/65 leading-relaxed">IV nutrient therapy, chelation protocols, and structured detoxification programs.</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#331A80]/50 to-[#331A80]/20 border border-[#6644BB]/25 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-[#D4A843]/15 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw] text-[#D4A843]">🔬</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F5F0E8] mb-[1vh]">Diagnostics</h3>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/65 leading-relaxed">True Vision blood analysis, ECS profiling, and AI-assisted diagnostic interpretation.</p>
          </div>
        </div>

        <div className="mt-[3vh] flex items-center gap-[2vw]">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#D4A843]/30 to-transparent" />
          <p className="font-body text-[1.3vw] text-[#B8A4E0]/50">All products sourced through the FFPMA catalog</p>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-[#D4A843]/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
