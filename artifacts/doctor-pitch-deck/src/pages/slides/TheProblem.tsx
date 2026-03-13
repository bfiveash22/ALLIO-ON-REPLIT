export default function TheProblem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-[#00D4AA]/[0.03] blur-[80px]" />
      <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] rounded-full bg-[#FFD700]/[0.03] blur-[80px]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1.5vh]">
          The Problem
        </p>
        <h2 className="font-display text-[4.2vw] leading-[1] font-bold text-white tracking-tight max-w-[55vw]">
          Medicine Has Lost Its Way
        </h2>

        <div className="flex-1 flex items-center mt-[4vh]">
          <div className="grid grid-cols-2 gap-x-[4vw] gap-y-[4vh] w-full">
            <div className="glass-card p-[2.5vw]">
              <p className="font-display text-[3.5vw] font-bold text-[#FFD700] leading-none">88%</p>
              <p className="font-body text-[1.6vw] text-[#C8D6E5] mt-[1.5vh] leading-snug">
                of chronic disease is driven by lifestyle — yet protocols ignore root cause
              </p>
            </div>

            <div className="glass-card p-[2.5vw]">
              <p className="font-display text-[3.5vw] font-bold text-[#00D4AA] leading-none">7 min</p>
              <p className="font-body text-[1.6vw] text-[#C8D6E5] mt-[1.5vh] leading-snug">
                average patient visit — not enough time for real assessment or care
              </p>
            </div>

            <div className="glass-card p-[2.5vw]">
              <p className="font-display text-[3.5vw] font-bold text-[#FFD700] leading-none">63%</p>
              <p className="font-body text-[1.6vw] text-[#C8D6E5] mt-[1.5vh] leading-snug">
                of physicians report burnout from insurance-driven constraints
              </p>
            </div>

            <div className="glass-card p-[2.5vw]">
              <p className="font-display text-[3.5vw] font-bold text-[#00D4AA] leading-none">$0</p>
              <p className="font-body text-[1.6vw] text-[#C8D6E5] mt-[1.5vh] leading-snug">
                spent by most plans on functional diagnostics or personalized protocols
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
