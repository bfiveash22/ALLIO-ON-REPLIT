export default function PhilosophySlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0F1D30]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F]/30 via-transparent to-[#FFD700]/5" />
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(0,212,170,0.08),transparent_50%)]" />

      <div className="relative flex flex-col items-center justify-center h-full px-[10vw] py-[8vh]">
        <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[4vh]">
          Core Philosophy
        </p>

        <h2 className="font-display text-[3.5vw] leading-[1.1] text-[#F0F4F8] text-center max-w-[60vw] italic">
          "Your body is a self-healing organism. Our job is to identify what's blocking that healing and give you the tools to remove those blocks."
        </h2>

        <div className="mt-[4vh] h-[1px] w-[8vw] bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent" />

        <p className="font-body text-[2vw] text-[#C8D6E5] mt-[3vh]">
          — The FF PMA 2026 Protocol
        </p>

        <div className="mt-[6vh] flex gap-[4vw]">
          <div className="text-center">
            <p className="font-display text-[3vw] text-[#FFD700]">127+</p>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/70 mt-[0.5vh]">Therapeutic Products</p>
          </div>
          <div className="w-[1px] h-[8vh] bg-[#2A4F7A]/30" />
          <div className="text-center">
            <p className="font-display text-[3vw] text-[#FFD700]">5R</p>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/70 mt-[0.5vh]">Clinical Framework</p>
          </div>
          <div className="w-[1px] h-[8vh] bg-[#2A4F7A]/30" />
          <div className="text-center">
            <p className="font-display text-[3vw] text-[#FFD700]">48</p>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/70 mt-[0.5vh]">AI Agents</p>
          </div>
        </div>
      </div>
    </div>
  );
}
