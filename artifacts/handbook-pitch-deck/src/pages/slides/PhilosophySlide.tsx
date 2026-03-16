export default function PhilosophySlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1A0D40]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#331A80]/30 via-transparent to-[#D4A843]/5" />
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(102,68,187,0.08),transparent_50%)]" />

      <div className="relative flex flex-col items-center justify-center h-full px-[10vw] py-[8vh]">
        <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#D4A843] uppercase mb-[4vh]">
          Core Philosophy
        </p>

        <h2 className="font-display text-[3.5vw] leading-[1.1] text-[#F5F0E8] text-center max-w-[60vw] italic">
          "Your body is a self-healing organism. Our job is to identify what's blocking that healing and give you the tools to remove those blocks."
        </h2>

        <div className="mt-[4vh] h-[1px] w-[8vw] bg-gradient-to-r from-transparent via-[#D4A843]/50 to-transparent" />

        <p className="font-body text-[2vw] text-[#B8A4E0] mt-[3vh]">
          — The Steve Baker 2026 Protocol
        </p>

        <div className="mt-[6vh] flex gap-[4vw]">
          <div className="text-center">
            <p className="font-display text-[3vw] text-[#D4A843]">127+</p>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/70 mt-[0.5vh]">Therapeutic Products</p>
          </div>
          <div className="w-[1px] h-[8vh] bg-[#6644BB]/30" />
          <div className="text-center">
            <p className="font-display text-[3vw] text-[#D4A843]">5R</p>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/70 mt-[0.5vh]">Clinical Framework</p>
          </div>
          <div className="w-[1px] h-[8vh] bg-[#6644BB]/30" />
          <div className="text-center">
            <p className="font-display text-[3vw] text-[#D4A843]">48</p>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/70 mt-[0.5vh]">AI Agents</p>
          </div>
        </div>
      </div>
    </div>
  );
}
