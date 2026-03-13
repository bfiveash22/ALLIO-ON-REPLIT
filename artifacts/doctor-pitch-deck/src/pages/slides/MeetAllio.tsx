const base = import.meta.env.BASE_URL;

export default function MeetAllio() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,212,170,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,215,0,0.05),transparent_40%)]" />

      <div className="relative flex h-full">
        <div className="flex flex-col justify-center w-[55%] px-[7vw] py-[7vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#00D4AA] uppercase mb-[2vh]">
            Introducing
          </p>
          <h2 className="font-display text-[5vw] leading-[0.95] font-bold text-white tracking-tight">
            Meet ALLIO
          </h2>
          <p className="font-body text-[1.8vw] text-[#C8D6E5] mt-[3vh] leading-relaxed max-w-[38vw]">
            A self-evolving medical intelligence network — 43 specialized AI agents working across 7 divisions to support your practice.
          </p>

          <div className="mt-[4vh] grid grid-cols-2 gap-[2vw] max-w-[38vw]">
            <div className="flex items-center gap-[1vw]">
              <p className="font-display text-[2.5vw] font-bold text-[#FFD700]">43</p>
              <p className="font-body text-[1.4vw] text-[#C8D6E5]">AI Agents</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <p className="font-display text-[2.5vw] font-bold text-[#00D4AA]">7</p>
              <p className="font-body text-[1.4vw] text-[#C8D6E5]">Divisions</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <p className="font-display text-[2.5vw] font-bold text-[#FFD700]">24/7</p>
              <p className="font-body text-[1.4vw] text-[#C8D6E5]">Autonomous</p>
            </div>
            <div className="flex items-center gap-[1vw]">
              <p className="font-display text-[2.5vw] font-bold text-[#00D4AA]">∞</p>
              <p className="font-body text-[1.4vw] text-[#C8D6E5]">Self-Evolving</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center w-[45%] pr-[5vw]">
          <img
            src={`${base}assets/ff_pma_allio_combined_logo.png`}
            crossOrigin="anonymous"
            className="w-[32vw] object-contain opacity-90"
            alt="ALLIO logo"
          />
        </div>
      </div>
    </div>
  );
}
