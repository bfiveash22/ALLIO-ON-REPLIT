export default function ClinicalModel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#162D4A] to-[#1E3A5F]">
      <div className="absolute top-[10vh] left-[50vw] w-[50vw] h-[50vw] rounded-full bg-[#00D4AA]/[0.04] blur-[100px]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[6vh]">
        <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1vh]">
          Proprietary Methodology
        </p>
        <h2 className="font-display text-[4vw] leading-[1] font-bold text-white tracking-tight">
          The 5R Clinical Model
        </h2>
        <p className="font-body text-[1.8vw] text-[#8395A7] mt-[1.5vh] max-w-[50vw]">
          A systematic approach to restoring the body's innate healing capacity
        </p>

        <div className="flex-1 flex items-center mt-[3vh]">
          <div className="flex gap-[1.5vw] w-full">
            <div className="flex-1 glass-card-gold p-[2vw] flex flex-col items-center text-center">
              <p className="font-display text-[2.8vw] font-bold text-[#00D4AA]">01</p>
              <p className="font-display text-[2vw] font-bold text-white mt-[1vh]">Reduce</p>
              <p className="font-body text-[1.4vw] text-[#C8D6E5] mt-[1vh] leading-snug">
                Eliminate toxins, inflammation, and metabolic burden
              </p>
            </div>

            <div className="flex-1 glass-card-gold p-[2vw] flex flex-col items-center text-center">
              <p className="font-display text-[2.8vw] font-bold text-[#00D4AA]">02</p>
              <p className="font-display text-[2vw] font-bold text-white mt-[1vh]">Rebalance</p>
              <p className="font-body text-[1.4vw] text-[#C8D6E5] mt-[1vh] leading-snug">
                Restore hormonal, neural, and microbial equilibrium
              </p>
            </div>

            <div className="flex-1 glass-card-gold p-[2vw] flex flex-col items-center text-center">
              <p className="font-display text-[2.8vw] font-bold text-[#FFD700]">03</p>
              <p className="font-display text-[2vw] font-bold text-white mt-[1vh]">Reactivate</p>
              <p className="font-body text-[1.4vw] text-[#C8D6E5] mt-[1vh] leading-snug">
                Reignite cellular energy and mitochondrial function
              </p>
            </div>

            <div className="flex-1 glass-card-gold p-[2vw] flex flex-col items-center text-center">
              <p className="font-display text-[2.8vw] font-bold text-[#00D4AA]">04</p>
              <p className="font-display text-[2vw] font-bold text-white mt-[1vh]">Restore</p>
              <p className="font-body text-[1.4vw] text-[#C8D6E5] mt-[1vh] leading-snug">
                Rebuild tissue integrity and organ system function
              </p>
            </div>

            <div className="flex-1 glass-card-gold p-[2vw] flex flex-col items-center text-center">
              <p className="font-display text-[2.8vw] font-bold text-[#FFD700]">05</p>
              <p className="font-display text-[2vw] font-bold text-white mt-[1vh]">Revitalize</p>
              <p className="font-body text-[1.4vw] text-[#C8D6E5] mt-[1vh] leading-snug">
                Sustain peak vitality and long-term wellness
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
