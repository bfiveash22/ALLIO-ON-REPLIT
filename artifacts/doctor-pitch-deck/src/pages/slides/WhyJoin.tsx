export default function WhyJoin() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,215,0,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,rgba(0,212,170,0.05),transparent_40%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[6vh]">
        <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#00D4AA] uppercase mb-[1vh]">
          The Physician Advantage
        </p>
        <h2 className="font-display text-[4.2vw] leading-[1] font-bold text-white tracking-tight">
          Why Doctors Are Joining
        </h2>

        <div className="flex-1 flex items-center mt-[3vh]">
          <div className="grid grid-cols-2 gap-[3vw] w-full">
            <div className="glass-card p-[3vw] flex gap-[2vw]">
              <div className="shrink-0">
                <div className="w-[3.5vw] h-[3.5vw] rounded-full bg-[#00D4AA]/15 flex items-center justify-center">
                  <p className="font-display text-[1.8vw] text-[#00D4AA]">01</p>
                </div>
              </div>
              <div>
                <p className="font-display text-[2vw] font-bold text-white mb-[1vh]">Practice Freedom</p>
                <p className="font-body text-[1.5vw] text-[#C8D6E5] leading-snug">
                  Prescribe root-cause protocols without insurance gatekeeping or pharmaceutical pressure
                </p>
              </div>
            </div>

            <div className="glass-card p-[3vw] flex gap-[2vw]">
              <div className="shrink-0">
                <div className="w-[3.5vw] h-[3.5vw] rounded-full bg-[#FFD700]/15 flex items-center justify-center">
                  <p className="font-display text-[1.8vw] text-[#FFD700]">02</p>
                </div>
              </div>
              <div>
                <p className="font-display text-[2vw] font-bold text-white mb-[1vh]">Scale Expertise</p>
                <p className="font-body text-[1.5vw] text-[#C8D6E5] leading-snug">
                  AI handles research, protocol generation, and administration — you focus on patients
                </p>
              </div>
            </div>

            <div className="glass-card p-[3vw] flex gap-[2vw]">
              <div className="shrink-0">
                <div className="w-[3.5vw] h-[3.5vw] rounded-full bg-[#00D4AA]/15 flex items-center justify-center">
                  <p className="font-display text-[1.8vw] text-[#00D4AA]">03</p>
                </div>
              </div>
              <div>
                <p className="font-display text-[2vw] font-bold text-white mb-[1vh]">Turnkey Infrastructure</p>
                <p className="font-body text-[1.5vw] text-[#C8D6E5] leading-snug">
                  PMA documents, patient portal, protocol engine, and compliance — all provided from day one
                </p>
              </div>
            </div>

            <div className="glass-card p-[3vw] flex gap-[2vw]">
              <div className="shrink-0">
                <div className="w-[3.5vw] h-[3.5vw] rounded-full bg-[#FFD700]/15 flex items-center justify-center">
                  <p className="font-display text-[1.8vw] text-[#FFD700]">04</p>
                </div>
              </div>
              <div>
                <p className="font-display text-[2vw] font-bold text-white mb-[1vh]">Community, Not Franchise</p>
                <p className="font-body text-[1.5vw] text-[#C8D6E5] leading-snug">
                  Collegial network of like-minded practitioners — shared learning, shared patients, no corporate overhead
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
