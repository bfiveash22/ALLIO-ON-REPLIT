export default function ProtocolArchitect() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F] to-[#162D4A]">
      <div className="absolute top-0 right-0 w-[45vw] h-[45vw] rounded-full bg-[#00D4AA]/[0.04] blur-[100px]" />
      <div className="absolute bottom-[10vh] left-[5vw] w-[20vw] h-[20vw] rounded-full bg-[#FFD700]/[0.04] blur-[80px]" />

      <div className="relative flex h-full">
        <div className="flex flex-col justify-center w-[50%] pl-[7vw] pr-[3vw] py-[7vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#00D4AA] uppercase mb-[2vh]">
            AI Protocol Architect
          </p>
          <h2 className="font-display text-[3.8vw] leading-[1.05] font-bold text-white tracking-tight">
            Describe a Case. Get a Complete Protocol.
          </h2>
          <p className="font-body text-[1.7vw] text-[#C8D6E5] mt-[3vh] leading-relaxed">
            Our AI synthesizes patient history, labs, and symptoms into a fully personalized treatment protocol — matched to 127+ therapeutic products in minutes, not hours.
          </p>
        </div>

        <div className="flex flex-col justify-center w-[50%] pr-[7vw] py-[7vh]">
          <div className="glass-card glow-cyan p-[2.5vw] mb-[2.5vh]">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
                <p className="font-body text-[1.2vw] text-[#00D4AA]">1</p>
              </div>
              <p className="font-body text-[1.6vw] font-semibold text-white">Input</p>
            </div>
            <p className="font-body text-[1.4vw] text-[#C8D6E5] leading-snug">
              Patient symptoms, labs, history, and health goals
            </p>
          </div>

          <div className="glass-card glow-cyan p-[2.5vw] mb-[2.5vh]">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                <p className="font-body text-[1.2vw] text-[#FFD700]">2</p>
              </div>
              <p className="font-body text-[1.6vw] font-semibold text-white">Process</p>
            </div>
            <p className="font-body text-[1.4vw] text-[#C8D6E5] leading-snug">
              AI cross-references research, 5R model, and product catalog
            </p>
          </div>

          <div className="glass-card glow-gold p-[2.5vw]">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#00D4AA]/20 flex items-center justify-center">
                <p className="font-body text-[1.2vw] text-[#00D4AA]">3</p>
              </div>
              <p className="font-body text-[1.6vw] font-semibold text-white">Output</p>
            </div>
            <p className="font-body text-[1.4vw] text-[#C8D6E5] leading-snug">
              Complete protocol with products, dosing, and clinical rationale
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
