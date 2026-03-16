export default function FiveRFrameworkSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0F1D30]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_50%,rgba(51,26,128,0.4),transparent_60%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="text-center mb-[4vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1.5vh]">
            The 5R Clinical Model
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8]">
            Five Phases of Restoration
          </h2>
        </div>

        <div className="flex-1 flex items-center gap-[1.5vw]">
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-[5vw] h-[5vw] rounded-full bg-gradient-to-br from-[#2A4F7A] to-[#1E3A5F] flex items-center justify-center mb-[2vh] border-2 border-[#FFD700]/30">
              <span className="font-display text-[2.2vw] text-[#FFD700]">1</span>
            </div>
            <h3 className="font-body text-[1.8vw] font-bold text-[#F0F4F8] mb-[1vh]">Reduce</h3>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/65 leading-relaxed px-[0.5vw]">Eliminate toxins, inflammatory triggers, and pathogenic loads burdening the system.</p>
          </div>

          <div className="w-[3vw] flex items-center justify-center">
            <div className="w-full h-[2px] bg-gradient-to-r from-[#2A4F7A]/40 to-[#FFD700]/30" />
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-[5vw] h-[5vw] rounded-full bg-gradient-to-br from-[#2A4F7A] to-[#1E3A5F] flex items-center justify-center mb-[2vh] border-2 border-[#FFD700]/30">
              <span className="font-display text-[2.2vw] text-[#FFD700]">2</span>
            </div>
            <h3 className="font-body text-[1.8vw] font-bold text-[#F0F4F8] mb-[1vh]">Rebalance</h3>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/65 leading-relaxed px-[0.5vw]">Restore hormonal, metabolic, and microbiome equilibrium through targeted interventions.</p>
          </div>

          <div className="w-[3vw] flex items-center justify-center">
            <div className="w-full h-[2px] bg-gradient-to-r from-[#2A4F7A]/40 to-[#FFD700]/30" />
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-[5vw] h-[5vw] rounded-full bg-gradient-to-br from-[#2A4F7A] to-[#1E3A5F] flex items-center justify-center mb-[2vh] border-2 border-[#FFD700]/30">
              <span className="font-display text-[2.2vw] text-[#FFD700]">3</span>
            </div>
            <h3 className="font-body text-[1.8vw] font-bold text-[#F0F4F8] mb-[1vh]">Reactivate</h3>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/65 leading-relaxed px-[0.5vw]">Stimulate dormant healing pathways through peptides, bioregulators, and cellular signaling.</p>
          </div>

          <div className="w-[3vw] flex items-center justify-center">
            <div className="w-full h-[2px] bg-gradient-to-r from-[#2A4F7A]/40 to-[#FFD700]/30" />
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-[5vw] h-[5vw] rounded-full bg-gradient-to-br from-[#2A4F7A] to-[#1E3A5F] flex items-center justify-center mb-[2vh] border-2 border-[#FFD700]/30">
              <span className="font-display text-[2.2vw] text-[#FFD700]">4</span>
            </div>
            <h3 className="font-body text-[1.8vw] font-bold text-[#F0F4F8] mb-[1vh]">Restore</h3>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/65 leading-relaxed px-[0.5vw]">Rebuild damaged tissues, replenish nutrient reserves, and optimize organ function.</p>
          </div>

          <div className="w-[3vw] flex items-center justify-center">
            <div className="w-full h-[2px] bg-gradient-to-r from-[#2A4F7A]/40 to-[#FFD700]/30" />
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-[5vw] h-[5vw] rounded-full bg-gradient-to-br from-[#2A4F7A] to-[#1E3A5F] flex items-center justify-center mb-[2vh] border-2 border-[#FFD700]/30">
              <span className="font-display text-[2.2vw] text-[#FFD700]">5</span>
            </div>
            <h3 className="font-body text-[1.8vw] font-bold text-[#F0F4F8] mb-[1vh]">Revitalize</h3>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/65 leading-relaxed px-[0.5vw]">Sustain long-term vitality through lifestyle optimization and maintenance protocols.</p>
          </div>
        </div>

        <div className="mt-[2vh] text-center">
          <p className="font-body text-[1.4vw] text-[#C8D6E5]/50">Each phase is custom-sequenced per patient by DR. FORMULA, the AI Protocol Architect</p>
        </div>
      </div>
    </div>
  );
}
